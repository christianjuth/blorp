//
//  LemmyTopPostWidgetBundle.swift
//  LemmyTopPostWidget
//
//  Created by Butt on 5/1/25.
//

import WidgetKit
import SwiftUI

@main
struct LemmyTopPostWidgetBundle: WidgetBundle {
    var body: some Widget {
        LemmyTopPostWidget()
        LemmyTopPostWidgetControl()
        LemmyTopPostWidgetLiveActivity()
    }
}
