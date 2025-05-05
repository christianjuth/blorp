//
//  TopPostWidget.swift
//  TopPostWidget
//
//  Created by Butt on 5/1/25.
//

import WidgetKit
import SwiftUI
import AppIntents
import Foundation

enum TopPostCommunityOption: String, CaseIterable, AppEnum {
  case empty                      = "empty"
  case uplifting_lemmy_world      = "upliftingnews@lemmy.world"
  case technology_lemmy_world     = "technology@lemmy.world"
  case news_lemmy_world           = "news@lemmy.world"

  // 2️⃣ What the picker itself is called:
  static var typeDisplayRepresentation =
    TypeDisplayRepresentation(name: "Community")

  // 3️⃣ How each case shows up:
  static var caseDisplayRepresentations: [Self: DisplayRepresentation] = [
    .empty: DisplayRepresentation(
      title: "Any",
    ),
    .news_lemmy_world: DisplayRepresentation(
      title: "news",
      subtitle: "@lemmy.world"
    ),
    .technology_lemmy_world: DisplayRepresentation(
      title: "technology",
      subtitle: "@lemmy.world"
    ),
    .uplifting_lemmy_world: DisplayRepresentation(
      title: "upliftingnews",
      subtitle: "@lemmy.world"
    ),
  ]
}

struct TopPostConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configure Top Post Widget" }
    static var description: IntentDescription { "Shows the top post every hour." }
    
    @Parameter(
        title: "Community",
        default: TopPostCommunityOption.empty
    )
    var community: TopPostCommunityOption?
}

// MARK: - Timeline Entry
struct TopPostEntry: TimelineEntry {
    let date: Date
    let title: String
    var community: String
    let apId: String
}

// MARK: - Provider
struct TopPostProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> TopPostEntry {
        TopPostEntry(date: Date(), title: "Loading…", community: "", apId: "")
    }
    
    func snapshot(for configuration: TopPostConfigurationAppIntent, in context: Context) async -> TopPostEntry {
        TopPostEntry(date: Date(), title: "Lenny the giant loggerhead turtle heads back to the sea", community: "upliftingnews@lemmy.world", apId: "")
    }
    
    func timeline(for configuration: TopPostConfigurationAppIntent, in context: Context) async -> Timeline<TopPostEntry> {
        let date = Date()
        let topPost = await fetchTopPost(for: configuration.community?.rawValue)
        var entry = TopPostEntry(
            date: date,
            title: topPost?.post.name ?? "No posts",
            community: topPost?.community.name ?? "",
            apId: topPost?.post.ap_id ?? ""
        )
        
        if let actorId = topPost?.community.actor_id {
            do {
                entry.community = try communityApId(from: actorId)
                
            } catch {
            }
        }
        
        // Schedule next update in 1 hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: date)!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }

    private func fetchTopPost(for community: String?) async -> LemmyPost? {
        var urlStr = "https://lemm.ee/api/v3/post/list?sort=TopDay&type=All&limit=1"
        if (community != nil && community != TopPostCommunityOption.empty.rawValue) {
            urlStr += "&community_name=" + community!
        }
        guard let url = URL(string: urlStr) else {
            return nil
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let wrapper = try JSONDecoder().decode(LemmyPostsResponse.self, from: data)
            return wrapper.posts.first
        } catch {
            print("Error fetching top post: \(error)")
            return nil
        }
    }
}

// MARK: - Widget View
struct TopPostWidgetEntryView: View {
    var entry: TopPostEntry
    
    private var backgroundGradient: LinearGradient {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.011, green: 0.019, blue: 0.207),
                    Color(red: 0.207, green: 0.101, blue: 0.713),
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    
    private var tapURL: URL? {
            makeLemmyPostURL(
                domain: "blorpblorp.xyz",
                community: entry.community,
                apId: entry.apId
            )
        }

    var body: some View {
        ZStack {
            VStack(alignment: .leading, spacing: 7) {
                HStack(alignment: .top) {
                    Text("Top post")
                        .font(.subheadline)
                        .foregroundColor(.white)
                    Spacer()
                    Image("TopPostLogo")
                      .resizable()
                      .aspectRatio(contentMode: .fit)
                      .frame(width: 40, height: 40)
                }
                Spacer()
                Text("c/\(entry.community)")
                    .font(.caption)
                    .foregroundColor(Color(red: 1, green: 0.121, blue: 0.733))
                Text(entry.title)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .lineLimit(2)
            }
            .widgetURL(tapURL)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .containerBackground(for: .widget) {
            backgroundGradient
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget Declaration
struct TopPostWidget: Widget {
    let kind: String = "TopPostWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: TopPostConfigurationAppIntent.self,
            provider: TopPostProvider()
        ) { entry in
            TopPostWidgetEntryView(entry: entry)
        }
        .containerBackgroundRemovable(false)
        .configurationDisplayName("Top Post")
        .description("Shows the top post every hour.")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Previews
struct TopPostWidget_Previews: PreviewProvider {
    static var previews: some View {
        TopPostWidgetEntryView(
            entry: TopPostEntry(date: .now, title: "Sample Title", community: "example", apId: "")
        )
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
