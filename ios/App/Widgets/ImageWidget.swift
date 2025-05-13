//
//  ImageWidget.swift
//  ImageWidget
//
//  Created by Butt on 5/1/25.
//

import WidgetKit
import SwiftUI
import AppIntents
import Foundation

enum ImageCommunityOption: String, CaseIterable, AppEnum {
  case aww_lemmy_world            = "aww@lemmy.world"
  case pics_lemmy_world           = "pics@lemmy.world"
  case cat_lemmy_world            = "cat@lemmy.world"
  case dogs_lemmy_world           = "dogs@lemmy.world"

  // 2️⃣ What the picker itself is called:
  static var typeDisplayRepresentation =
    TypeDisplayRepresentation(name: "Community")

  // 3️⃣ How each case shows up:
  static var caseDisplayRepresentations: [Self: DisplayRepresentation] = [
    .aww_lemmy_world:  DisplayRepresentation(
              title: "aww",
              subtitle: "@lemmy.world"
           ),
    .cat_lemmy_world:  DisplayRepresentation(
              title: "cat",
              subtitle: "@lemmy.world"
           ),
    .dogs_lemmy_world: DisplayRepresentation(
              title: "dogs",
              subtitle: "@lemmy.world"
           ),
    .pics_lemmy_world: DisplayRepresentation(
              title: "pics",
              subtitle: "@lemmy.world"
           ),
  ]
}

struct ImageConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configure Picture Widget" }
    static var description: IntentDescription { "Show cute images on your homescreen." }

    @Parameter(
        title: "Community",
        default: ImageCommunityOption.pics_lemmy_world
    )
    var community: ImageCommunityOption?
}

// MARK: - Timeline Entry
struct ImageEntry: TimelineEntry {
    let date: Date
    let title: String
    var community: String
    let apId: String
    let thumbnailData: Data?
}

// MARK: - Provider
struct ImageProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> ImageEntry {
        ImageEntry(date: Date(), title: "", community: "", apId: "", thumbnailData: nil)
    }
    
    func snapshot(for configuration: ImageConfigurationAppIntent, in context: Context) async -> ImageEntry {
        let placeholderURL = URL(string:
                  "https://fastly.picsum.photos/id/765/800/400.jpg?hmac=PK0uVX0lM9FOl6w0DhIbioGUWY0IGYnG2T9n244Iq_w"
                )!
                let data = try? await URLSession.shared.data(from: placeholderURL).0
        return ImageEntry(
                    date: Date(),
                    title: "Cute Placeholder",
                    community: configuration.community?.rawValue ?? "",
                    apId: "",
                    thumbnailData: data
                )
    }
    
    func timeline(for configuration: ImageConfigurationAppIntent, in context: Context) async -> Timeline<ImageEntry> {
        let date = Date()
        let topPost = await fetchImage(for: configuration.community?.rawValue ?? "aww@lemmy.world")
        
        let thumbData: Data?
        if let urlString = topPost?.post.url,
           let url = URL(string: urlString) {
            do {
                // 1) Fetch raw bytes
                let (data, _) = try await URLSession.shared.data(from: url)
                // 2) Downsample to, say, 300×300 points (→ 600×600px @2×)
                if let smallImage = downsampledImage(from: data, to: CGSize(width: 300, height: 300)) {
                    // 3) Convert back to Data for storage/baking into widget
                    thumbData = smallImage.pngData()
                } else {
                    thumbData = nil
                }
            } catch {
                print("Error fetching image: \(error)")
                thumbData = nil
            }
        } else {
            thumbData = nil
        }

        var entry = ImageEntry(
            date: date,
            title: topPost?.post.name ?? "No posts",
            community: topPost?.community.name ?? "",
            apId: topPost?.post.ap_id ?? "",
            thumbnailData: thumbData
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

    private func fetchImage(for community: String) async -> LemmyPost? {
        // Try TopDay first, then fallback to TopWeek
        let sortOptions = ["TopDay", "TopWeek", "Hot"]
        for sort in sortOptions {
            // Build URL
            let query = [
                "community_name": community,
                "sort": sort,
                "type": "All",
                "limit": "50"
            ]
            var components = URLComponents(string: "https://lemm.ee/api/v3/post/list")
            components?.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
            guard let url = components?.url else { continue }

            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                let wrapper = try JSONDecoder().decode(LemmyPostsResponse.self, from: data)
                for postWrapper in wrapper.posts {
                    let thumbnail = postWrapper.post.thumbnail_url;
                    if thumbnail != nil {
                        return postWrapper
                    }
                }
            } catch {
                print("Error fetching posts sorted by \(sort): \(error)")
            }
        }
        return nil
    }
}

// MARK: - Widget View
struct ImageWidgetEntryView: View {
    var entry: ImageEntry
    
    private var tapURL: URL? {
            makeLemmyPostURL(
                domain: "blorpblorp.xyz",
                community: entry.community,
                apId: entry.apId
            )
        }

    var body: some View {
        ZStack {}
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .widgetURL(tapURL)
        // 3) Here’s the required containerBackground — this drives your full-bleed image
        .containerBackground(for: .widget) {
            Group {
                if let data = entry.thumbnailData,
                   let uiImage = UIImage(data: data) {
                    Image(uiImage: uiImage)
                      .resizable()
                      .scaledToFill()
                } else {
                    Color.black
                }
            }
        }
    }
}

// MARK: - Widget Declaration
struct ImageWidget: Widget {
    let kind: String = "ImageWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: ImageConfigurationAppIntent.self,
            provider: ImageProvider()
        ) { entry in
            ImageWidgetEntryView(entry: entry)
        }
        .containerBackgroundRemovable(false)
        .configurationDisplayName("Picture")
        .description("Show cute images on your homescreen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

// MARK: - Previews
struct ImageWidget_Previews: PreviewProvider {
    static var previews: some View {
        ImageWidgetEntryView(
            entry: ImageEntry(date: .now, title: "", community: "", apId: "", thumbnailData: nil)
        )
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
