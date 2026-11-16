import { Outlet } from "react-router-dom";
import { Appbar, AuthModal } from "../components";
import { useUser } from "../hooks/useUser";

export default function Base() {
    const user = useUser();

    return (
        <>
            <Appbar />
            <Outlet />
            <AuthModal Open={user.Open} HandleClose={user.HandleClose} AuthType={"login"}></AuthModal>
        </>
    )
}