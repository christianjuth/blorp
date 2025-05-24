//
//  ImageWidget.swift
//  ImageWidget
//
//  Created by Butt on 5/1/25.
//

import AppIntents
import ImageIO
import SwiftUI
import WidgetKit
import os

//let problemImg = URL(
//  string:
//    "https://lemmy.ml/api/v3/image_proxy?url=https%3A%2F%2Flemmy.world%2Fpictrs%2Fimage%2F76f564e3-9a49-4d79-9714-66c2d195c298.jpeg"
//)!

// MARK: - Community Options

enum ImageCommunityOption: String, CaseIterable, AppEnum {
  case aww_lemmy_world = "aww@lemmy.world"
  case pics_lemmy_world = "pics@lemmy.world"
  case cat_lemmy_world = "cat@lemmy.world"
  case dogs_lemmy_world = "dogs@lemmy.world"

  static var typeDisplayRepresentation =
    TypeDisplayRepresentation(name: "Community")

  static var caseDisplayRepresentations: [Self: DisplayRepresentation] = [
    .aww_lemmy_world: DisplayRepresentation(title: "aww", subtitle: "@lemmy.world"),
    .pics_lemmy_world: DisplayRepresentation(title: "pics", subtitle: "@lemmy.world"),
    .cat_lemmy_world: DisplayRepresentation(title: "cat", subtitle: "@lemmy.world"),
    .dogs_lemmy_world: DisplayRepresentation(title: "dogs", subtitle: "@lemmy.world"),
  ]
}

// MARK: - Intent Configuration

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
  let community: String
  let apId: String
  let thumbnailData: Data?
}

// MARK: - Logger

private let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "ImageWidget")

// MARK: - Provider

struct ImageProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> ImageEntry {
    ImageEntry(
      date: Date(),
      title: "Loading…",
      community: "",
      apId: "",
      thumbnailData: nil
    )
  }

  func snapshot(for configuration: ImageConfigurationAppIntent, in context: Context) async
    -> ImageEntry
  {
    let placeholderURL = URL(
      string:
        "https://fastly.picsum.photos/id/765/800/400.jpg?hmac=PK0uVX0lM9FOl6w0DhIbioGUWY0IGYnG2T9n244Iq_w"
    )!
    let data = (try? await URLSession.shared.data(from: placeholderURL).0) ?? Data()
    let thumbData = downsampledData(from: data, maxPixelSize: 600)
    return ImageEntry(
      date: Date(),
      title: "Cute Placeholder",
      community: configuration.community?.rawValue ?? "",
      apId: "",
      thumbnailData: thumbData
    )
  }

  func timeline(for configuration: ImageConfigurationAppIntent, in context: Context) async
    -> Timeline<ImageEntry>
  {
    let now = Date()
    let communityRaw = configuration.community?.rawValue ?? "aww@lemmy.world"
    logger.debug("Fetching top post for community: \(communityRaw)")

    let topPost = await fetchImage(for: communityRaw)
    var thumbnailURLString = topPost?.post.thumbnail_url
    if thumbnailURLString?.hasPrefix("http") != true {
      thumbnailURLString = nil
    }
    logger.debug("Thumbnail URL: \(thumbnailURLString ?? "nil")")

    // Download & downsample image data
    var thumbData: Data? = nil
    if let urlString = thumbnailURLString,
      let url = URL(string: urlString)
    {
      do {
        let data = try await fetchData(with: url)
        thumbData = downsampledData(from: data, maxPixelSize: 600)
      } catch {
        logger.debug("Error fetching image data: \(String(describing: error))")
      }
    }

    // Resolve community display name via actor_id if available
    var communityName = topPost?.community.name ?? communityRaw
    if let actorId = topPost?.community.actor_id {
      do {
        communityName = try communityApId(from: actorId)
      } catch {
        logger.debug("Failed to parse actorId: \(String(describing: error))")
      }
    }

    let entry = ImageEntry(
      date: now,
      title: topPost?.post.name ?? "No posts",
      community: communityName,
      apId: topPost?.post.ap_id ?? "",
      thumbnailData: thumbData
    )

    // Update again in one hour
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: now)!
    return Timeline(entries: [entry], policy: .after(next))
  }

  private func fetchImage(for community: String) async -> LemmyPost? {
    let sorts = ["TopDay", "TopWeek", "Hot"]
    for sort in sorts {
      logger.debug("Trying sort: \(sort)")
      var comps = URLComponents(string: "https://lemm.ee/api/v3/post/list")
      comps?.queryItems = [
        URLQueryItem(name: "community_name", value: community),
        URLQueryItem(name: "sort", value: sort),
        URLQueryItem(name: "type", value: "All"),
        URLQueryItem(name: "limit", value: "50"),
      ]
      guard let url = comps?.url else { continue }
      do {
        let (data, _) = try await URLSession.shared.data(from: url)
        let wrapper = try JSONDecoder().decode(LemmyPostsResponse.self, from: data)
        if let postWrapper = wrapper.posts.first(where: {
          ($0.post.thumbnail_url ?? "").hasPrefix("http")
        }) {
          return postWrapper
        }
      } catch {
        logger.debug("Error fetching posts (\(sort)): \(String(describing: error))")
      }
    }
    return nil
  }

  private func downsampledData(from data: Data, maxPixelSize: CGFloat) -> Data? {
    let options: CFDictionary =
      [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceShouldCacheImmediately: true,
        kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
      ] as CFDictionary

    guard
      let src = CGImageSourceCreateWithData(data as CFData, nil),
      let cgThumb = CGImageSourceCreateThumbnailAtIndex(src, 0, options)
    else {
      return nil
    }

    return UIImage(cgImage: cgThumb).pngData()
  }
}

// MARK: - Widget View

struct ImageWidgetEntryView: View {
  let entry: ImageEntry

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
      .containerBackground(for: .widget) {
        if let data = entry.thumbnailData,
          let uiImage = UIImage(data: data)
        {
          Image(uiImage: uiImage)
            .resizable()
            .scaledToFill()
        } else {
          Color(.systemGray5)
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
      entry: ImageEntry(
        date: .now,
        title: "Preview",
        community: "pics@lemmy.world",
        apId: "",
        thumbnailData: nil
      )
    )
    .previewContext(WidgetPreviewContext(family: .systemMedium))
  }
}
