import { checkServerType } from "@/utils/servers";

export default function Search() {
    const { isAppleMusic } = checkServerType();

    return (
        <div>
            <h1>Search</h1>
        </div>
    );
}
