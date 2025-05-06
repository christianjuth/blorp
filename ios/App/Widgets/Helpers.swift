import Foundation
import UIKit

enum APIDError: Error {
    case invalidURL
    case unsupportedPath
}

// MARK: - Model
struct LemmyPost: Decodable {
    let post: PostData
    let community: CommunityData

    struct PostData: Decodable {
        let id: Int
        let name: String    // post title
        let ap_id: String
        let url: String?
        let thumbnail_url: String?
    }

    struct CommunityData: Decodable {
        let name: String
        let actor_id: String
    }
}

// Wrapper for the API response
struct LemmyPostsResponse: Decodable {
    let posts: [LemmyPost]
}

func isImageURL(_ s: String?) -> Bool {
    guard
      let str = s?
        .trimmingCharacters(in: .whitespacesAndNewlines)
        .lowercased(),
      let url = URL(string: str)
    else { return false }
    let ext = url.pathExtension
    return ["png", "jpg", "jpeg", "gif", "webp"].contains(ext)
}

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

func downsampledImage(from data: Data, to pointSize: CGSize, scale: CGFloat = UIScreen.main.scale) -> UIImage? {
    let maxDimensionInPixels = max(pointSize.width, pointSize.height) * scale
    let options: [CFString: Any] = [
        kCGImageSourceShouldCache: false,
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceThumbnailMaxPixelSize: maxDimensionInPixels
    ]

    guard let src = CGImageSourceCreateWithData(data as CFData, nil),
          let cgImg = CGImageSourceCreateThumbnailAtIndex(src, 0, options as CFDictionary)
    else {
        return nil
    }

    return UIImage(cgImage: cgImg, scale: scale, orientation: .up)
}
