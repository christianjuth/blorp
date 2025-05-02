//
//  AppIntent.swift
//  LemmyTopPostWidget
//
//  Created by Butt on 5/1/25.
//

import WidgetKit
import AppIntents

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }
    static var description: IntentDescription { "This is an example widget." }

    // An example configurable parameter.
    //@Parameter(title: "Favorite Emoji", default: "😃")
    //var favoriteEmoji: String
}
