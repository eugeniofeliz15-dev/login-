import AccountSettings from "./AccountSettings";
import type { User } from "../types";

interface PerfilModalProps {
  user: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
  onTemporaryAvatarChange: (file: File | undefined) => void;
}

export function PerfilModal({ user, onClose, onUpdated, onTemporaryAvatarChange }: PerfilModalProps) {
  return <AccountSettings user={user} onClose={onClose} onUpdated={onUpdated} onTemporaryAvatarChange={onTemporaryAvatarChange} />;
}
