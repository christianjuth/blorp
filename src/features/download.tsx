import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import QRCode from "react-qr-code";

import { FaApple } from "react-icons/fa";
import { FaAppStoreIos } from "react-icons/fa";
import { FcAndroidOs, FcLinux } from "react-icons/fc";
import { RiQrCodeLine } from "react-icons/ri";
import { MdInstallDesktop, MdInstallMobile } from "react-icons/md";
import { ContentGutters } from "../components/gutters";
import { Button } from "../components/ui/button";
import Bowser from "bowser";
import { Fragment, ReactNode, useId, useRef } from "react";
import { cn } from "../lib/utils";
import { Title } from "../components/title";
import { Link } from "@/src/routing/index";
import { isTauri } from "../lib/tauri";
import { Capacitor } from "@capacitor/core";

const browser = Bowser.getParser(window.navigator.userAgent);
const osName = browser.getOS().name?.toLowerCase();

function Card({
  icon,
  description,
  downloadLink,
  os,
}: {
  icon: React.ReactNode;
  description: string;
  downloadLink?: string;
  os: string;
}) {
  const id = useId();
  const modal = useRef<HTMLIonModalElement>(null);
  const highlight = os.toLowerCase() === osName;
  return (
    <>
      <div
        className={cn(
          "p-6 rounded-xl border flex flex-col gap-5 items-center",
          highlight && "bg-brand/15 border-brand border-2",
        )}
      >
        {icon}
        <span className="text-sm text-muted-foreground text-center">
          {description}
        </span>

        {downloadLink && (
          <div className="flex flex-row gap-1">
            <Button
              variant="ghost"
              asChild
              className={cn(highlight && "hover:bg-brand/80")}
            >
              <a href={downloadLink} target="_blank" rel="noopener noreferrer">
                Download
              </a>
            </Button>
            <Button
              variant="ghost"
              id={id}
              className={cn(highlight && "hover:bg-brand/80")}
            >
              QR Code <RiQrCodeLine />
            </Button>
          </div>
        )}
      </div>

      {downloadLink && (
        <IonModal ref={modal} trigger={id}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => modal.current?.dismiss()}>
                  Close
                </IonButton>
              </IonButtons>
              <IonTitle>Down for {os}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="max-w-sm aspect-square mx-auto h-full p-4">
              <QRCode value={downloadLink} className="w-full h-full" />
            </div>
          </IonContent>
        </IonModal>
      )}
    </>
  );
}

const CARDS: { os: string; card: ReactNode }[] = [
  {
    os: "macos",
    card: (
      <Card
        icon={<FaApple className="text-5xl" />}
        description="Universal build for Intel and Apple Silicon"
        downloadLink="https://github.com/christianjuth/blorp/releases/latest/download/Mac-Installer.pkg"
        os="MacOS"
      />
    ),
  },
  {
    os: "ios",
    card: (
      <Card
        icon={<FaAppStoreIos className="text-5xl fill-blue-500" />}
        description="Currently in beta installed via TestFlight"
        downloadLink="https://testflight.apple.com/join/T2pYyShr"
        os="iOS"
      />
    ),
  },
  {
    os: "android",
    card: (
      <Card
        icon={<FcAndroidOs className="text-5xl" />}
        description="Closed beta testing, message moseschrute@lemmy.ml to join."
        os="Android"
      />
    ),
  },
  {
    os: "linux",
    card: (
      <Card
        icon={<FcLinux className="text-5xl" />}
        description="Comming soon"
        downloadLink=""
        os="Linux"
      />
    ),
  },
].sort((a, b) => {
  if (a.os === osName) {
    return -1;
  }
  if (b.os === osName) {
    return 1;
  }
  return 0;
});

export default function Download() {
  return (
    <IonPage>
      <Title>Download</Title>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Download</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <ContentGutters>
          <div className="flex-1 py-8">
            <h2 className="font-bold text-2xl">
              Blorp works best when installed
            </h2>
            <div className="grid md:grid-cols-3 pt-6 gap-5">
              {CARDS.map(({ os, card }) => (
                <Fragment key={os}>{card}</Fragment>
              ))}
            </div>
          </div>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}

export function DownloadButton() {
  if (isTauri() || Capacitor.isNativePlatform()) {
    return null;
  }
  if (osName !== "macos") {
    return null;
  }
  return (
    <Link to="/download" className="text-brand">
      <MdInstallDesktop className="text-xl max-md:hidden" />
      <MdInstallMobile className="text-xl md:hidden" />
    </Link>
  );
}
