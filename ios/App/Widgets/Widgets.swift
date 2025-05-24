import SwiftUI
import WidgetKit

@main
struct MyAppWidgets: WidgetBundle {
  @WidgetBundleBuilder
  var body: some Widget {
    TopPostWidget()
    ImageWidget()
  }
}
