import { useParams } from "one";
import { isWeb, ScrollView } from "tamagui";
import { Sidebar } from "~/src/components/communities/community-sidebar";
import { ContentGutters } from "~/src/components/gutters";
import { useCustomTabBarHeight } from "~/src/components/nav/bottom-tab-bar";
import { useCustomHeaderHeight } from "~/src/components/nav/hooks";

export default function Page() {
  const { communityName } = useParams<{ communityName: string }>();
  const header = useCustomHeaderHeight();
  const tabBar = useCustomTabBarHeight();
  return (
    communityName && (
      <ScrollView
        contentInset={{
          top: header.height,
          bottom: tabBar.height,
        }}
        mt={isWeb ? header.height : undefined}
      >
        <ContentGutters>
          <Sidebar communityName={communityName} />
        </ContentGutters>
      </ScrollView>
    )
  );
}

export async function generateStaticParams() {
  return [];
}
