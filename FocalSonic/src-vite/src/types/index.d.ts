export { };

declare global {
    interface IgniteViewCommandBridge {
        [key: string]: (...args: any[]) => any
    }

    interface IgniteViewWindow {
        commandBridge: IgniteViewCommandBridge
        platformHints?: string[]
        resolverURL?: string
    }

    interface Window {
        SHOW_RADIOS_SECTION: boolean | undefined
        SERVER_TYPE: string | undefined
        igniteView?: IgniteViewWindow
        rehydratePlayerStore?: (newState: string) => Promise<void> | void
        rehydrateSharedStore?: (newState: string) => Promise<void> | void
    }
}
