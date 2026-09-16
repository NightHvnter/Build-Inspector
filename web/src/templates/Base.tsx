import { Outlet } from "react-router-dom";
import { Appbar } from "../components";

export default function Base() {
    return (
        <>
            <Appbar />
            <Outlet />
        </>
    )
}