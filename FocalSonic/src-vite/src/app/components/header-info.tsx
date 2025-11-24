import { Link } from "react-router-dom";
import { Fragment } from "react/jsx-runtime";
import { Dot } from "./dot";

type TextBadge = {
    content: string | null
    type: "text"
}

type LinkBadge = {
    content: string | null
    type: "link"
    link: string
}

type ChipBadge = {
    content: string | null
    type: "chip"
    link: string
}

type ComponentBadge = {
    content: React.ReactNode
    type: "component"
}


export type BadgesData = Array<TextBadge | LinkBadge | ChipBadge | ComponentBadge>

interface HeaderInfoProps {
    showFirstDot?: boolean
    badges: BadgesData
}

const renderBadge = {
    text: (props) => <p className="opacity-80 drop-shadow">{props.item.content}</p>,
    chip: (props) => <p className="opacity-80 drop-shadow rounded-sm px-1 bg-primary text-primary-foreground">{props.item.content}</p>,
    link: (props) => <Link to={props.item.link} className="flex opacity-80 drop-shadow hover:opacity-100 hover:underline"> {props.item.content}</Link>,
    component: (props) => <>{props.item.content}</>,
};

export function HeaderInfoGenerator({
    showFirstDot = true,
    badges,
}: HeaderInfoProps) {
    return (
        <div className="flex text-sm">
            <Fragment>
                {badges
                    .filter((item) => item.content)
                    .map((item, index, array) => (
                        <Fragment key={index}>
                            {showFirstDot && index === 0 && <Dot />}
                            {
                                (() => {
                                    const Badge = renderBadge[item.type] || renderBadge.text;
                                    return <Badge item={item} />;
                                })()
                            }
                            {index < array.length - 1 && <Dot />}
                        </Fragment>
                    ))}
            </Fragment>
        </div>
    );
}
