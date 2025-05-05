import WidgetKit
import SwiftUI

@main
struct MyAppWidgets: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        TopPostWidget()
        ImageWidget()
    }
}
