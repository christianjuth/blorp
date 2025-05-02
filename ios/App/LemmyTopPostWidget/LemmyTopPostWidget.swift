//
//  LemmyTopPostWidget.swift
//  LemmyTopPostWidget
//
//  Created by Butt on 5/1/25.
//

import WidgetKit
import SwiftUI
import AppIntents
import Foundation

/// Safely percent-encodes a path component, preserving “@” and “.” 
/// while escaping everything else that might break a URL.
extension String {
    func asPathComponent() -> String {
        // Start with the unreserved chars + “@” + “.” that we want to allow
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~@.")
        return self.addingPercentEncoding(withAllowedCharacters: allowed) ?? self
    }
}

/// Builds a universal‐link URL for a Lemmy post.
/// - Parameters:
///   - domain: your associated‐domains host, e.g. "blorpblorp.xyz"
///   - community: the community name (no leading “r/”)
///   - apId: the ActivityPub ID, e.g. "microblogmemes@lemmy.world"
func makeLemmyPostURL(domain: String,
                      community: String,
                      apId: String) -> URL? {
    let encodedApId = apId.asPathComponent()
    let encodedCommunity = community.asPathComponent()
    let urlString = "https://\(domain)/home/c/\(encodedCommunity)/posts/\(encodedApId)"
    return URL(string: urlString)
}

enum APIDError: Error {
    case invalidURL
    case unsupportedPath
}

/// Converts a Lemmy community URL into its AP ID.
/// - Parameter urlString: e.g. "https://lemmy.world/c/microblogmemes"
/// - Returns: "microblogmemes@lemmy.world"
/// - Throws: `APIDError.invalidURL` if it can’t parse the URL, or
///           `APIDError.unsupportedPath` if it doesn’t find a community segment.
func communityApId(from urlString: String) throws -> String {
    // 1. Parse URL & host
    guard let url = URL(string: urlString),
          let host = url.host else {
        throw APIDError.invalidURL
    }

    // 2. Break up the path (drops leading "/")
    let segments = url.pathComponents.filter { $0 != "/" }

    // 3. Extract community name
    let community: String
    if segments.count >= 2, ["c", "community"].contains(segments[0]) {
        community = segments[1]
    } else if segments.count >= 1 {
        community = segments[0]
    } else {
        throw APIDError.unsupportedPath
    }

    // 4. Return AP ID
    return "\(community)@\(host)"
}

// MARK: - Model
struct TopPost: Decodable {
    let post: PostData
    let community: CommunityData

    struct PostData: Decodable {
        let id: Int
        let name: String    // post title
        let ap_id: String
    }

    struct CommunityData: Decodable {
        let name: String
        let actor_id: String
    }
}

// Wrapper for the API response
struct ResponseWrapper: Decodable {
    let posts: [TopPost]
}

// MARK: - Timeline Entry
struct SimpleEntry: TimelineEntry {
    let date: Date
    let title: String
    var community: String
    let apId: String
}

// MARK: - Provider
struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), title: "Loading…", community: "", apId: "")
    }
    
    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        SimpleEntry(date: Date(), title: "Sample Post", community: "c/example", apId: "")
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        let date = Date()
        let topPost = await fetchTopPost()
        var entry = SimpleEntry(
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

    private func fetchTopPost() async -> TopPost? {
        guard let url = URL(string: "https://lemm.ee/api/v3/post/list?sort=TopDay&type=All&limit=1") else {
            return nil
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let wrapper = try JSONDecoder().decode(ResponseWrapper.self, from: data)
            return wrapper.posts.first
        } catch {
            print("Error fetching top post: \(error)")
            return nil
        }
    }
}

// MARK: - Widget View
struct LemmyTopPostWidgetEntryView: View {
    var entry: SimpleEntry
    
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
                    Image("Logo")
                      .resizable()
                      .aspectRatio(contentMode: .fit)
                      .frame(width: 40, height: 40)
                    
                }
                Spacer()
                Text("c/\(entry.community)")
                    .font(.caption)
                    .foregroundColor(.pink.opacity(0.9))
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
struct LemmyTopPostWidget: Widget {
    let kind: String = "LemmyTopPostWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: ConfigurationAppIntent.self,
            provider: Provider()
        ) { entry in
            LemmyTopPostWidgetEntryView(entry: entry)
        }
        .containerBackgroundRemovable(false)
        .configurationDisplayName("Top Lemmy Post")
        .description("Shows the top post on your Lemmy instance every hour.")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - Previews
struct LemmyTopPostWidget_Previews: PreviewProvider {
    static var previews: some View {
        LemmyTopPostWidgetEntryView(
            entry: SimpleEntry(date: .now, title: "Sample Title", community: "example", apId: "")
        )
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
