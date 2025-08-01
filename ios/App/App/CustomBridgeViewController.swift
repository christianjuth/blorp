import UIKit
import Capacitor

@objc(CustomBridgeViewController)
class CustomBridgeViewController: CAPBridgeViewController {
  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    if #available(iOS 11.0, *) {
        // Enforce no safe-area or automatic insets
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
        // Zero out any existing insets (just in case)
        webView?.scrollView.contentInset = .zero
        webView?.scrollView.scrollIndicatorInsets = .zero
    }
  }
}
