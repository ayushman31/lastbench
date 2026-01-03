import { Menu } from "./Menu"
import { WaypointsIcon } from "./icons/waypoints";
import SplitText from "./SplitText";

export const Header = () => {
    return (
        <div className="flex justify-between w-full">
            <div className=" flex items-center justify-center gap-3">
                <WaypointsIcon size={24} />
                <SplitText
                    text="Dashboard"
                    className="text-lg font-normal text-center"
                    delay={100}
                    duration={0.6}
                    ease="power3.out"
                    splitType="chars"
                    from={{ opacity: 0, y: 40 }}
                    to={{ opacity: 1, y: 0 }}
                    threshold={0.1}
                    rootMargin="-100px"
                    textAlign="center"
                />
            </div>


            <div className="flex items-center justify-center">
                <Menu />
            </div>
        </div>
    )
}