import ActionSearchBar from "./ActionSearchBar"
import { Menu } from "./Menu"

export const Header = () => {
    return (
        <div className="flex justify-between w-full">
            <div className="mt-4">
                <p>Dashboard</p>
            </div>

            {/* <div>
                <ActionSearchBar />
            </div> */}

            <div>
                <Menu />
            </div>
        </div>
    )
}