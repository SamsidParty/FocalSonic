#if MACOS

using System.Runtime.InteropServices;

namespace FocalSonic.MacOS
{
    /// <summary>Just enough of the Objective-C runtime to talk to AppKit.</summary>
    static class ObjC
    {
        const string Runtime = "/usr/lib/libobjc.A.dylib";

        [DllImport(Runtime)] static extern IntPtr objc_getClass(string name);
        [DllImport(Runtime)] static extern IntPtr sel_registerName(string name);
        [DllImport(Runtime)] static extern IntPtr object_getClass(IntPtr instance);
        [DllImport(Runtime)] static extern IntPtr class_getInstanceMethod(IntPtr cls, IntPtr selector);
        [DllImport(Runtime)] static extern IntPtr method_setImplementation(IntPtr method, IntPtr implementation);
        [DllImport(Runtime)] [return: MarshalAs(UnmanagedType.I1)]
        static extern bool class_addMethod(IntPtr cls, IntPtr selector, IntPtr implementation, string types);
        [DllImport(Runtime)] static extern IntPtr class_getName(IntPtr cls);

        [DllImport(Runtime, EntryPoint = "objc_msgSend")] public static extern IntPtr Send(IntPtr receiver, IntPtr selector);
        [DllImport(Runtime, EntryPoint = "objc_msgSend")] public static extern IntPtr Send(IntPtr receiver, IntPtr selector, IntPtr argument);
        [DllImport(Runtime, EntryPoint = "objc_msgSend")] public static extern IntPtr Send(IntPtr receiver, IntPtr selector, long argument);
        [DllImport(Runtime, EntryPoint = "objc_msgSend")] public static extern IntPtr Send(IntPtr receiver, IntPtr selector, [MarshalAs(UnmanagedType.LPUTF8Str)] string argument);
        [DllImport(Runtime, EntryPoint = "objc_msgSend")] public static extern long SendLong(IntPtr receiver, IntPtr selector);

        public static IntPtr Class(string name) => objc_getClass(name);
        public static IntPtr Selector(string name) => sel_registerName(name);

        public static IntPtr Send(IntPtr receiver, string selector) => Send(receiver, Selector(selector));
        public static IntPtr Send(IntPtr receiver, string selector, IntPtr argument) => Send(receiver, Selector(selector), argument);
        public static IntPtr Send(IntPtr receiver, string selector, long argument) => Send(receiver, Selector(selector), argument);

        public static IntPtr String(string value) => Send(Class("NSString"), Selector("stringWithUTF8String:"), value);

        public static string? ToString(IntPtr nsString) =>
            nsString == IntPtr.Zero ? null : Marshal.PtrToStringUTF8(Send(nsString, Selector("UTF8String")));

        public static string ClassName(IntPtr instance) =>
            instance == IntPtr.Zero ? "nil" : Marshal.PtrToStringUTF8(class_getName(object_getClass(instance))) ?? "?";

        [DllImport(Runtime)] static extern IntPtr objc_allocateClassPair(IntPtr superclass, string name, nint extraBytes);
        [DllImport(Runtime)] static extern void objc_registerClassPair(IntPtr cls);

        /// <summary>Creates (once) and returns an instance of an empty NSObject subclass.</summary>
        public static IntPtr NewObject(string className)
        {
            var cls = objc_getClass(className);
            if (cls == IntPtr.Zero)
            {
                cls = objc_allocateClassPair(Class("NSObject"), className, 0);
                objc_registerClassPair(cls);
            }
            return Send(Send(cls, "alloc"), "init");
        }

        /// <summary>Adds (or replaces) an instance method on the class of <paramref name="instance"/>.</summary>
        public static void Implement(IntPtr instance, string selector, IntPtr implementation, string types)
        {
            var cls = object_getClass(instance);
            var sel = Selector(selector);
            if (!class_addMethod(cls, sel, implementation, types))
            {
                method_setImplementation(class_getInstanceMethod(cls, sel), implementation);
            }
        }

        /// <summary>BOOL is a signed char on Intel but a C bool on Apple silicon.</summary>
        public static string Bool => RuntimeInformation.ProcessArchitecture == Architecture.Arm64 ? "B" : "c";
    }

    /// <summary>
    /// Runs work on the AppKit main thread through libdispatch. Unlike IgniteView's
    /// InvokeOnMainThread this also works while no window is open (playing in the background).
    /// </summary>
    static unsafe class MainThread
    {
        const string LibSystem = "/usr/lib/libSystem.dylib";

        [DllImport(LibSystem)] static extern void dispatch_async_f(IntPtr queue, IntPtr context, delegate* unmanaged<IntPtr, void> work);

        // dispatch_get_main_queue() is a macro for the address of this symbol.
        static readonly IntPtr MainQueue = NativeLibrary.GetExport(NativeLibrary.Load(LibSystem), "_dispatch_main_q");

        public static void Post(Action work)
        {
            dispatch_async_f(MainQueue, (IntPtr)GCHandle.Alloc(work), &Run);
        }

        [UnmanagedCallersOnly]
        static void Run(IntPtr context)
        {
            var handle = GCHandle.FromIntPtr(context);
            var work = (Action)handle.Target!;
            handle.Free();

            try { work(); }
            catch (Exception ex) { Console.Error.WriteLine("Main thread work failed: " + ex); }
        }
    }
}

#endif
