"use client";

import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContactPhoneIcon from "@mui/icons-material/ContactPhoneOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import type { Client } from "@/components/client-form";
import { DeleteClientButton } from "@/components/delete-client-button";
import { SaveContactButton } from "@/components/save-contact-button";

type Props = {
  client: Client;
  isAdmin: boolean;
  onDeleted?: () => void;
};

/**
 * "⋮" menu with the patient's actions. Workers only get "Llamadas"; admins also save the
 * contact, edit and delete. The menu stays mounted so the confirmation dialogs outlive it.
 */
export function ClientCardMenu({ client: c, isAdmin, onDeleted }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  const name = `${c.first_name} ${c.last_name}`;

  return (
    <>
      <IconButton size="small" aria-label={`Más opciones de ${name}`} onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        keepMounted
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem component="a" href={`/clients/${c.id}?tab=llamadas`} onClick={close}>
          <ListItemIcon>
            <PhoneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Llamadas</ListItemText>
        </MenuItem>
        {isAdmin && [
          <SaveContactButton
            key="save"
            id={c.id}
            firstName={c.first_name}
            lastName={c.last_name}
            mobile={c.mobile}
            whatsapp={c.whatsapp}
            savedAt={c.contact_saved_at}
            renderTrigger={({ open, saved, disabled }) => (
              <MenuItem
                disabled={disabled}
                onClick={() => {
                  close();
                  open();
                }}
              >
                <ListItemIcon>
                  {saved ? <CheckCircleIcon fontSize="small" color="success" /> : <ContactPhoneIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText secondary={saved ? `Descargado el ${new Date(saved).toLocaleDateString("es-PE")}` : undefined}>
                  Guardar en el teléfono
                </ListItemText>
              </MenuItem>
            )}
          />,
          <MenuItem key="edit" component="a" href={`/clients/${c.id}`} onClick={close}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>,
          <Divider key="divider" />,
          <DeleteClientButton
            key="delete"
            id={c.id}
            name={name}
            onDeleted={onDeleted}
            renderTrigger={(open) => (
              <MenuItem
                onClick={() => {
                  close();
                  open();
                }}
                sx={{ color: "error.main" }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Eliminar</ListItemText>
              </MenuItem>
            )}
          />,
        ]}
      </Menu>
    </>
  );
}
