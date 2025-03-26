import { IonActionSheet, IonButton } from "@ionic/react";
import { useId } from "react";

export function UserDropdown() {
  const id = useId();
  return (
    <>
      <IonButton id={id}>Open</IonButton>
      <IonActionSheet
        trigger={id}
        // header="Actions"
        buttons={[
          {
            text: "Delete",
            role: "destructive",
            data: {
              action: "delete",
            },
          },
          {
            text: "Share",
            data: {
              action: "share",
            },
          },
          {
            text: "Cancel",
            role: "cancel",
            data: {
              action: "cancel",
            },
          },
        ]}
      ></IonActionSheet>
    </>
  );
}
