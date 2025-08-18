import { FontSelect } from "./font";
import { PlayerSettings } from "./player";
import { ThemeSettingsPicker } from "./theme";

export function Appearance() {
    return (
        <div className="space-y-4">
            <FontSelect />
            <PlayerSettings />
            <ThemeSettingsPicker />
        </div>
    );
}
