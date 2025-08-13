import { FontSelect } from "./font";
import { ThemeSettingsPicker } from "./theme";

export function Appearance() {
    return (
        <div className="space-y-4">
            <FontSelect />
            <ThemeSettingsPicker />
        </div>
    );
}
