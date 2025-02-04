import { useContext, createContext, useState, useRef } from "react";
import { Modal } from "./modal";
import _ from "lodash";
import { XStack, YStack, Text } from "tamagui";
import { Button } from "./button";

const Context = createContext<{
  promptAlert: (msg: string) => Promise<boolean>;
}>({
  promptAlert: () => new Promise((_, reject) => reject(false)),
});

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | undefined>();

  const promises = useRef<
    { resolve: (val: boolean) => any; reject: () => any }[]
  >([]);
  const cancel = () => {
    setMsg(undefined);
    for (const { reject } of promises.current) {
      reject();
    }
    promises.current = [];
  };

  const confirm = () => {
    setMsg(undefined);
    for (const { resolve } of promises.current) {
      resolve(true);
    }
    promises.current = [];
  };

  return (
    <Context.Provider
      value={{
        promptAlert: (newMsg) => {
          setMsg(newMsg);
          return new Promise((resolve, reject) => {
            promises.current.push({
              resolve,
              reject,
            });
          });
        },
      }}
    >
      <Modal open={_.isString(msg) && msg.length > 0} onClose={cancel}>
        <YStack maxWidth={500} p="$3" gap="$3">
          <Text>{msg}</Text>
          <XStack gap="$2">
            <Button size="$3" f={1} bg="$color9" onPress={cancel}>
              Cancel
            </Button>
            <Button size="$3" f={1} onPress={confirm}>
              Continue
            </Button>
          </XStack>
        </YStack>
      </Modal>
      {children}
    </Context.Provider>
  );
}

export function useAlert() {
  return useContext(Context).promptAlert;
}
