import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from "@ionic/react";
import { PageTitle } from "../components/page-title";
import { useParams } from "../routing";
import { useLinkContext } from "../routing/link-context";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolbarBackButton } from "../components/toolbar/toolbar-back-button";
import { UserDropdown } from "../components/nav";
import { useHideTabBarOnMount } from "../lib/hooks";

function ResponsiveImage({ img }: { img: string }) {
  const alt = "example";
  const backgroundColor = "black";
  const zoomFactor = 8;

  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0);

  const imageScale = useMemo(() => {
    if (
      containerWidth === 0 ||
      containerHeight === 0 ||
      imageNaturalWidth === 0 ||
      imageNaturalHeight === 0
    )
      return 0;
    const scale = Math.min(
      containerWidth / imageNaturalWidth,
      containerHeight / imageNaturalHeight,
    );
    return scale;
  }, [containerWidth, containerHeight, imageNaturalWidth, imageNaturalHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const handleResize = () => {
        if (container !== null) {
          const rect = container.getBoundingClientRect();
          setContainerWidth(rect.width);
          setContainerHeight(rect.height);
        } else {
          setContainerWidth(0);
          setContainerHeight(0);
        }
      };

      handleResize();
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      resizeObserver.observe(container);
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
      }}
      ref={containerRef}
    >
      <TransformWrapper
        key={`${containerWidth}x${containerHeight}-${imageScale}`}
        initialScale={imageScale}
        minScale={imageScale}
        maxScale={imageScale * zoomFactor}
        centerOnInit
      >
        <TransformComponent
          wrapperStyle={{
            width: "100%",
            height: "100%",
          }}
        >
          <img
            alt={alt}
            src={img}
            onLoad={(e) => {
              setImageNaturalWidth(e.currentTarget.naturalWidth);
              setImageNaturalHeight(e.currentTarget.naturalHeight);
            }}
            style={{
              maxWidth: imageNaturalWidth,
              maxHeight: imageNaturalHeight,
            }}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

export default function LightBox() {
  const linkCtx = useLinkContext();
  const { imgUrl } = useParams(`${linkCtx.root}lightbox/:imgUrl`);
  const src = decodeURIComponent(imgUrl);
  useHideTabBarOnMount();
  return (
    <IonPage>
      <PageTitle>Image</PageTitle>
      <IonHeader translucent={true}>
        <IonToolbar
          style={{
            "--ion-toolbar-background": "transparent",
            "--ion-toolbar-border-color": "#ffffff50",
          }}
        >
          <IonButtons slot="start">
            <ToolbarBackButton className="text-white dark:text-white" />
          </IonButtons>
          <IonButtons slot="end">
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent
        fullscreen={true}
        style={{
          "--ion-background-color": "black",
        }}
        scrollY={false}
      >
        <ResponsiveImage img={src} />
      </IonContent>
    </IonPage>
  );
}
