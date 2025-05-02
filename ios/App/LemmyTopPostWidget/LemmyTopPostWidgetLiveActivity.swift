//
//  LemmyTopPostWidgetLiveActivity.swift
//  LemmyTopPostWidget
//
//  Created by Butt on 5/1/25.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct LemmyTopPostWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct LemmyTopPostWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LemmyTopPostWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension LemmyTopPostWidgetAttributes {
    fileprivate static var preview: LemmyTopPostWidgetAttributes {
        LemmyTopPostWidgetAttributes(name: "World")
    }
}

extension LemmyTopPostWidgetAttributes.ContentState {
    fileprivate static var smiley: LemmyTopPostWidgetAttributes.ContentState {
        LemmyTopPostWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: LemmyTopPostWidgetAttributes.ContentState {
         LemmyTopPostWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: LemmyTopPostWidgetAttributes.preview) {
   LemmyTopPostWidgetLiveActivity()
} contentStates: {
    LemmyTopPostWidgetAttributes.ContentState.smiley
    LemmyTopPostWidgetAttributes.ContentState.starEyes
}
