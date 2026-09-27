import Modal from "@mui/material/Modal";
import { LoginComponent } from ".";

interface AuthModalProps {
  AuthType: string;
  Open: boolean;
  HandleClose: () => void;
}

export default function AuthModal(props: AuthModalProps) {
  return (
    <Modal open={props.Open} onClose={props.HandleClose}>
      {props.AuthType === "login" ? <LoginComponent /> : <></>}
    </Modal>
  );
}
