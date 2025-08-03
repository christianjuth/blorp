import {
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
} from "@ionic/react";
import { PageTitle } from "@/src/components/page-title";
import { useParams } from "../../routing";
import { useLinkContext } from "@/src/routing/link-context";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolbarBackButton } from "../../components/toolbar/toolbar-back-button";
import { UserDropdown } from "../../components/nav";
import {
  useHideTabBarOnMount,
  useIsActiveRoute,
  useNavbarHeight,
  useSafeAreaInsets,
  useUrlSearchState,
} from "../../lib/hooks";
import z from "zod";
import { ToolbarTitle } from "../../components/toolbar/toolbar-title";
import { cn } from "../../lib/utils";
import { ContentGutters } from "../../components/gutters";

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute">
      <button onClick={() => zoomIn()}>+</button>
      <button onClick={() => zoomOut()}>-</button>
      <button onClick={() => resetTransform()}>x</button>
    </div>
  );
};

export function ResponsiveImage({
  img,
  onZoom,
  paddingY = 0,
}: {
  paddingY?: number;
  img: string;
  onZoom: (scale: number) => void;
}) {
  const [allowPan, setAllowPan] = useState(false);
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
          setContainerHeight(rect.height - paddingY);
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
  }, [paddingY]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor,
      }}
      className="ion-content-scroll-host"
      ref={containerRef}
    >
      <TransformWrapper
        key={`${containerWidth}x${containerHeight}-${imageScale}`}
        initialScale={imageScale}
        minScale={imageScale}
        maxScale={imageScale * zoomFactor}
        centerOnInit
        onZoom={(z) => {
          const scale = z.state.scale / imageScale;
          setAllowPan(scale > 1.05);
          onZoom(scale);
        }}
        panning={{ disabled: !allowPan }}
        wheel={{
          disabled: true,
        }}
      >
        <TransformComponent
          wrapperStyle={{
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src={img}
            onLoad={(e) => {
              setImageNaturalWidth(e.currentTarget.naturalWidth);
              setImageNaturalHeight(e.currentTarget.naturalHeight);
            }}
            style={{
              minWidth: imageNaturalWidth,
              width: imageNaturalWidth,
              maxWidth: imageNaturalWidth,
              minHeight: imageNaturalHeight,
              height: imageNaturalHeight,
              maxHeight: imageNaturalHeight,
            }}
          />
        </TransformComponent>
        <Controls />
      </TransformWrapper>
    </div>
  );
}

export default function LightBox() {
  useHideTabBarOnMount();

  const linkCtx = useLinkContext();
  const { imgUrl } = useParams(`${linkCtx.root}lightbox/:imgUrl`);
  const src = decodeURIComponent(imgUrl);
  const [title] = useUrlSearchState("title", "", z.string());
  const [hideNav, setHideNav] = useState(false);
  const navbar = useNavbarHeight();
  const isActive = useIsActiveRoute();

  const insets = useSafeAreaInsets();
  const tabbar = {
    height: navbar.height,
    inset: insets.bottom,
  };

  return (
    <IonPage className="dark">
      <PageTitle>Image</PageTitle>
      <IonHeader translucent={true}>
        <IonToolbar
          style={{
            "--ion-toolbar-background": "transparent",
            "--ion-toolbar-border-color": "var(--shad-border)",
          }}
          className={cn(
            isActive && "absolute backdrop-blur-2xl",
            hideNav && "opacity-0",
          )}
        >
          <IonButtons slot="start" className="gap-2">
            <ToolbarBackButton />
            {title && <ToolbarTitle size="sm">{title}</ToolbarTitle>}
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
        <ResponsiveImage
          img={src}
          onZoom={(scale) => {
            setHideNav(scale > 1.05);
          }}
          paddingY={navbar.height + navbar.inset + tabbar.height + tabbar.inset}
        />
      </IonContent>
      <div
        className={cn(
          "border-t-[.5px] z-10 absolute bottom-0 inset-x-0 backdrop-blur-2xl",
          hideNav && "opacity-0",
          !isActive && "hidden",
        )}
        style={{
          height: tabbar.height + tabbar.inset,
          paddingBottom: tabbar.inset,
        }}
      >
        <ContentGutters>
          <div className="h-[60px] flex flex-row items-center"></div>
        </ContentGutters>
      </div>
    </IonPage>
  );
}
