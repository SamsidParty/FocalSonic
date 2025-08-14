import { FontSelect } from "./font";
import { PlayerPosition } from "./player-position";
import { ThemeSettingsPicker } from "./theme";

export function Appearance() {
    return (
        <div className="space-y-4">
            <FontSelect />
            <PlayerPosition />
            <ThemeSettingsPicker />
        </div>
    );
}
