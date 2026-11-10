#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dlfcn.h>
#include <unistd.h>
#include <stdbool.h>

typedef void* id;
typedef void* SEL;

static id (*objc_getClass_fn)(const char *name) = NULL;
static SEL (*sel_registerName_fn)(const char *name) = NULL;
static id (*objc_msgSend_ptr)(void) = NULL;

#define CLS(name) objc_getClass_fn(name)
#define S(name) sel_registerName_fn(name)

// Exact typed call helper for pointer/id args
static inline id msg0(id obj, SEL sel) {
    return ((id (*)(id, SEL))objc_msgSend_ptr)(obj, sel);
}
static inline id msg1(id obj, SEL sel, id a1) {
    return ((id (*)(id, SEL, id))objc_msgSend_ptr)(obj, sel, a1);
}
static inline id msg2(id obj, SEL sel, id a1, id a2) {
    return ((id (*)(id, SEL, id, id))objc_msgSend_ptr)(obj, sel, a1, a2);
}
static inline id msg3(id obj, SEL sel, id a1, id a2, id a3) {
    return ((id (*)(id, SEL, id, id, id))objc_msgSend_ptr)(obj, sel, a1, a2, a3);
}
// Double / CGFloat typed calls (ARM64 register d0!)
static inline id msg_double(id obj, SEL sel, double d) {
    return ((id (*)(id, SEL, double))objc_msgSend_ptr)(obj, sel, d);
}
static inline id msg_timer(id obj, SEL sel, double ti, id target, SEL action, id userInfo, bool repeats) {
    return ((id (*)(id, SEL, double, id, SEL, id, bool))objc_msgSend_ptr)(obj, sel, ti, target, action, userInfo, repeats);
}

static id make_nsstring(const char *str) {
    id NSStringClass = CLS("NSString");
    SEL sel = S("stringWithUTF8String:");
    return ((id (*)(id, SEL, const char*))objc_msgSend_ptr)(NSStringClass, sel, str);
}

// Global state for history & pinned
static char *pinned_items[10] = {
    "https://github.com/apple/swift-evolution",
    "const formatCurrency = (val) => new Intl.NumberFormat('en-US').format(val);",
    "#007AFF (macOS System Blue)",
    "sk_live_51M08920194819481abcdef9048123984"
};
static int pinned_count = 4;

static char *recent_items[20] = {
    "sudo lsof -i :3000 | awk \"NR>1 {print $2}\" | xargs kill -9",
    "{\"status\": 200, \"message\": \"Clipboard synced\"}",
    "Meeting notes: Finalize menu-bar popover animation",
    "git commit -m \"feat: add pinned clips up top\"",
    "#34C759",
    "https://news.ycombinator.com"
};
static int recent_count = 6;

static long last_change_count = 0;
static id status_item = NULL;
static id action_handler_instance = NULL;

static void update_menu(void);

// Target-Action callback handlers
static void on_copy_text(id self, SEL _cmd, id sender) {
    id repObj = msg0(sender, S("representedObject"));
    if (!repObj) return;
    const char *utf8 = (const char*)msg0(repObj, S("UTF8String"));
    if (!utf8) return;

    id pb = msg0(CLS("NSPasteboard"), S("generalPasteboard"));
    msg0(pb, S("clearContents"));
    id ptype = make_nsstring("public.utf8-plain-text");
    id nstr = make_nsstring(utf8);
    msg2(pb, S("setString:forType:"), nstr, ptype);
    last_change_count = (long)msg0(pb, S("changeCount"));
}

static void on_pin_text(id self, SEL _cmd, id sender) {
    id repObj = msg0(sender, S("representedObject"));
    if (!repObj) return;
    const char *utf8 = (const char*)msg0(repObj, S("UTF8String"));
    if (!utf8) return;

    if (pinned_count < 10) {
        pinned_items[pinned_count] = strdup(utf8);
        pinned_count++;
        update_menu();
    }
}

static void on_unpin_text(id self, SEL _cmd, id sender) {
    id repObj = msg0(sender, S("representedObject"));
    if (!repObj) return;
    const char *utf8 = (const char*)msg0(repObj, S("UTF8String"));
    if (!utf8) return;

    for (int i = 0; i < pinned_count; i++) {
        if (strcmp(pinned_items[i], utf8) == 0) {
            for (int j = i; j < pinned_count - 1; j++) {
                pinned_items[j] = pinned_items[j + 1];
            }
            pinned_count--;
            break;
        }
    }
    update_menu();
}

static void on_clear_history(id self, SEL _cmd, id sender) {
    recent_count = 0;
    update_menu();
}

static void on_open_web(id self, SEL _cmd, id sender) {
    id ws = msg0(CLS("NSWorkspace"), S("sharedWorkspace"));
    id url = msg1(CLS("NSURL"), S("URLWithString:"), make_nsstring("https://ais-dev-6mpykoat737msacdidswxj-357547823396.asia-southeast1.run.app"));
    msg1(ws, S("openURL:"), url);
}

static void on_quit(id self, SEL _cmd, id sender) {
    id app = msg0(CLS("NSApplication"), S("sharedApplication"));
    msg1(app, S("terminate:"), NULL);
}

static void on_timer_tick(id self, SEL _cmd, id sender) {
    id pb = msg0(CLS("NSPasteboard"), S("generalPasteboard"));
    long count = (long)msg0(pb, S("changeCount"));
    if (count == last_change_count) return;
    last_change_count = count;

    id ptype = make_nsstring("public.utf8-plain-text");
    id str = msg1(pb, S("stringForType:"), ptype);
    if (!str) return;

    const char *utf8 = (const char*)msg0(str, S("UTF8String"));
    if (!utf8 || strlen(utf8) == 0) return;

    if (recent_count > 0 && strcmp(recent_items[0], utf8) == 0) return;
    for (int i = 0; i < pinned_count; i++) {
        if (strcmp(pinned_items[i], utf8) == 0) return;
    }

    for (int i = 19; i > 0; i--) {
        recent_items[i] = recent_items[i - 1];
    }
    recent_items[0] = strdup(utf8);
    if (recent_count < 20) recent_count++;

    update_menu();
}

static void setup_action_class(void) {
    void *(*objc_allocateClassPair)(void*, const char*, size_t) = dlsym(RTLD_DEFAULT, "objc_allocateClassPair");
    void (*objc_registerClassPair)(void*) = dlsym(RTLD_DEFAULT, "objc_registerClassPair");
    bool (*class_addMethod)(void*, SEL, void*, const char*) = dlsym(RTLD_DEFAULT, "class_addMethod");

    id NSObjectClass = CLS("NSObject");
    id newClass = objc_allocateClassPair(NSObjectClass, "KopyKlipActionHandler", 0);
    if (newClass) {
        class_addMethod(newClass, S("onCopy:"), (void*)on_copy_text, "v@:@");
        class_addMethod(newClass, S("onPin:"), (void*)on_pin_text, "v@:@");
        class_addMethod(newClass, S("onUnpin:"), (void*)on_unpin_text, "v@:@");
        class_addMethod(newClass, S("onClear:"), (void*)on_clear_history, "v@:@");
        class_addMethod(newClass, S("onOpenWeb:"), (void*)on_open_web, "v@:@");
        class_addMethod(newClass, S("onQuit:"), (void*)on_quit, "v@:@");
        class_addMethod(newClass, S("onTimer:"), (void*)on_timer_tick, "v@:@");
        objc_registerClassPair(newClass);
        action_handler_instance = msg0(msg0(newClass, S("alloc")), S("init"));
    }
}

static void update_menu(void) {
    id menu = msg0(msg0(CLS("NSMenu"), S("alloc")), S("init"));
    msg1(menu, S("setAutoenablesItems:"), (id)0);

    // 1. Header (exact CopyClip prompt)
    id header = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                     make_nsstring("Select the clip you want to add to your clipboard"), NULL, make_nsstring(""));
    msg1(header, S("setEnabled:"), (id)0);
    msg1(menu, S("addItem:"), header);

    id sep1 = msg0(CLS("NSMenuItem"), S("separatorItem"));
    msg1(menu, S("addItem:"), sep1);

    // 2. PINNED SNIPPETS UP TOP (Requested feature!)
    if (pinned_count > 0) {
        id pinTitle = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                           make_nsstring("📌 PINNED SNIPPETS"), NULL, make_nsstring(""));
        msg1(pinTitle, S("setEnabled:"), (id)0);
        msg1(menu, S("addItem:"), pinTitle);

        for (int i = 0; i < pinned_count; i++) {
            char buf[96];
            snprintf(buf, sizeof(buf), "📌 %.50s%s", pinned_items[i], strlen(pinned_items[i]) > 50 ? "..." : "");
            for (char *p = buf; *p; p++) if (*p == '\n') *p = ' ';

            id item = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                           make_nsstring(buf), S("onCopy:"), make_nsstring(""));
            msg1(item, S("setTarget:"), action_handler_instance);
            msg1(item, S("setRepresentedObject:"), make_nsstring(pinned_items[i]));

            id sub = msg0(msg0(CLS("NSMenu"), S("alloc")), S("init"));
            id unpinItem = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                                make_nsstring("Unpin Snippet"), S("onUnpin:"), make_nsstring(""));
            msg1(unpinItem, S("setTarget:"), action_handler_instance);
            msg1(unpinItem, S("setRepresentedObject:"), make_nsstring(pinned_items[i]));
            msg1(sub, S("addItem:"), unpinItem);
            msg1(item, S("setSubmenu:"), sub);

            msg1(menu, S("addItem:"), item);
        }
        id sep2 = msg0(CLS("NSMenuItem"), S("separatorItem"));
        msg1(menu, S("addItem:"), sep2);
    }

    // 3. RECENT HISTORY ITEMS (with ⌘ 0 to ⌘ 9)
    for (int i = 0; i < recent_count; i++) {
        char keyEq[4] = "";
        if (i < 10) snprintf(keyEq, sizeof(keyEq), "%d", i);

        char buf[80];
        snprintf(buf, sizeof(buf), "%.46s%s", recent_items[i], strlen(recent_items[i]) > 46 ? "..." : "");
        for (char *p = buf; *p; p++) if (*p == '\n') *p = ' ';

        id item = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                       make_nsstring(buf), S("onCopy:"), make_nsstring(keyEq));
        msg1(item, S("setTarget:"), action_handler_instance);
        msg1(item, S("setRepresentedObject:"), make_nsstring(recent_items[i]));

        id sub = msg0(msg0(CLS("NSMenu"), S("alloc")), S("init"));
        id pinSub = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                         make_nsstring("📌 Pin to Top"), S("onPin:"), make_nsstring(""));
        msg1(pinSub, S("setTarget:"), action_handler_instance);
        msg1(pinSub, S("setRepresentedObject:"), make_nsstring(recent_items[i]));
        msg1(sub, S("addItem:"), pinSub);
        msg1(item, S("setSubmenu:"), sub);

        msg1(menu, S("addItem:"), item);
    }

    if (recent_count == 0 && pinned_count == 0) {
        id empty = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                        make_nsstring("No clips yet. Copy anything to add!"), NULL, make_nsstring(""));
        msg1(empty, S("setEnabled:"), (id)0);
        msg1(menu, S("addItem:"), empty);
    }

    id sep3 = msg0(CLS("NSMenuItem"), S("separatorItem"));
    msg1(menu, S("addItem:"), sep3);

    // 4. Clear History & Web UI
    id webItem = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                      make_nsstring("Open KopyKlip Window..."), S("onOpenWeb:"), make_nsstring(""));
    msg1(webItem, S("setTarget:"), action_handler_instance);
    msg1(menu, S("addItem:"), webItem);

    id clearItem = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                       make_nsstring("Clear History (Keeps Pinned)"), S("onClear:"), make_nsstring(""));
    msg1(clearItem, S("setTarget:"), action_handler_instance);
    msg1(menu, S("addItem:"), clearItem);

    id sep4 = msg0(CLS("NSMenuItem"), S("separatorItem"));
    msg1(menu, S("addItem:"), sep4);

    id quitItem = msg3(msg0(CLS("NSMenuItem"), S("alloc")), S("initWithTitle:action:keyEquivalent:"),
                      make_nsstring("Quit KopyKlip"), S("onQuit:"), make_nsstring("q"));
    msg1(quitItem, S("setTarget:"), action_handler_instance);
    msg1(menu, S("addItem:"), quitItem);

    msg1(status_item, S("setMenu:"), menu);
}

int main(int argc, const char *argv[]) {
    printf("[KopyKlip] Starting native macOS Menu Bar application on Apple Silicon...\n");
    fflush(stdout);

    void *libobjc = dlopen("/usr/lib/libobjc.A.dylib", RTLD_LAZY | RTLD_GLOBAL);
    void *appkit = dlopen("/System/Library/Frameworks/AppKit.framework/AppKit", RTLD_LAZY | RTLD_GLOBAL);
    if (!libobjc || !appkit) {
        fprintf(stderr, "[KopyKlip Error] Failed to load AppKit or libobjc\n");
        return 1;
    }

    objc_getClass_fn = (id (*)(const char*))dlsym(libobjc, "objc_getClass");
    sel_registerName_fn = (SEL (*)(const char*))dlsym(libobjc, "sel_registerName");
    objc_msgSend_ptr = (id (*)(void))dlsym(libobjc, "objc_msgSend");

    id app = msg0(CLS("NSApplication"), S("sharedApplication"));
    // Activation policy: Accessory (Menu bar app ONLY, zero dock icon clutter!)
    msg1(app, S("setActivationPolicy:"), (id)1);

    setup_action_class();

    // Create NSStatusItem in top menu bar (-1.0 = NSVariableStatusItemLength)
    id sb = msg0(CLS("NSStatusBar"), S("systemStatusBar"));
    status_item = msg_double(sb, S("statusItemWithLength:"), -1.0);

    id btn = msg0(status_item, S("button"));
    if (btn) {
        msg1(btn, S("setTitle:"), make_nsstring("📎"));
        msg1(btn, S("setToolTip:"), make_nsstring("KopyKlip - Mac Clipboard Manager"));
    }

    id pb = msg0(CLS("NSPasteboard"), S("generalPasteboard"));
    last_change_count = (long)msg0(pb, S("changeCount"));

    update_menu();

    // Start background timer (0.5s interval) using typed floating point call
    id timer = msg_timer(CLS("NSTimer"), S("scheduledTimerWithTimeInterval:target:selector:userInfo:repeats:"),
                         0.5, action_handler_instance, S("onTimer:"), NULL, true);

    printf("[KopyKlip] Success! Look at the top right of your macOS screen for the 📎 icon.\n");
    fflush(stdout);

    // Run event loop (keeps app running!)
    msg0(app, S("run"));
    return 0;
}
