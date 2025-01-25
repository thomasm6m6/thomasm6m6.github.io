// "import" links to code frameworks for various purposes. SwiftUI is Apple's user interface
// framework. It handles displaying the GUI (graphical UI) components. ServiceManagement is for
// managing services, i.e. programs that are automatically run in certain conditions (ours will be
// auto-started at login).
import SwiftUI
import ServiceManagement

// "main" is the standard name for the program's entry point (across most programming languages).
// GUI apps contain a lot of boilerplate code (code that must be included in most/all programs).
// The interesting part of this block is "MenuBarExtra", which is from SwiftUI, and creates a menu
// bar item. The "image" parameter specifies the icon for it, which in our case is named "icon" and
// is essentially a PNG loaded from the assets bundle elsewhere in the project directory.
// A MenuBarExtra is a scene, which you can think of as a window of some sort. (Other types of
// scenes include an application's primary window, and its settings pane.) A scene contains a set of
// views, which can be nested within themselves and are arbitrary UI elements. Here we have one view
// inside our MenuBarExtra scene, which is ContentView; that is defined below. Lastly, a couple of
// modifiers are applied to the scene and to the view: onAppear and menuBarExtraStyle.
@main
struct LlamaApp: App {
    var body: some Scene {
        MenuBarExtra("Llama", image: ImageResource(name: "Icon", bundle: .main)) {
            ContentView()
                // Code inside onAppear runs when the view appears (i.e., when the window opens.
                .onAppear {
                    // Register the application as a login item (so it autostarts on login)
                    try? SMAppService.mainApp.register()
                }
        }
        .menuBarExtraStyle(.window)
    }
}

// Defines a custom view. Everything in this block could be placed inside the above block, without
// defining a custom view, but that would make the code difficult to read.
// This view will contain the content of our app's window.
struct ContentView: View {
    // Variable declarations. They maintain state for various reasons. Their specific purpose will
    // become clear later.
    @StateObject private var viewModel = ImageViewModel()
    @State private var isVisible = false
    @State private var useNextImage = Bool.random()

    var body: some View {
        // A VStack is a view that contains a vertical stack of other views. In this case, it
        // contains only one subview, but is used here to apply other modifiers to (see below).
        // The reason these modifiers can't be applied to the subview (NonUpdatingImageView) is
        // an implementation detail.
        VStack {
            // Swift is a relatively high-level language, so code tends to be fairly compact. This
            // "if" line is doing all of the following:
            //   If the window is visible (isVisible):
            //     Set "image" to either viewModel.image, or viewModel.nextImage, depending on the
            //       value of useNextImage (randomly set to true or false).
            //     Create a NonUpdatingImageView to display the selected image.
            if isVisible, let image = useNextImage ? viewModel.nextImage : viewModel.image {
                    // Defined below.
                    NonUpdatingImageView(image: image)
            }
        }
        .frame(width: 200, height: 200)
        .padding(8)
        .onAppear {
            isVisible = true
            viewModel.fetchImage()
        }
        .onDisappear {
            isVisible = false
            useNextImage = !useNextImage
        }
    }
}

// Normally, we would just use an "Image", which is a standard SwiftUI view that displays a given
// image. For technical reasons, it is necessary in this (unusual) case to wrap "Image" with some
// additional code. Ignore most of this.
struct NonUpdatingImageView: View {
    let image: NSImage

    static func == (lhs: NonUpdatingImageView, rhs: NonUpdatingImageView) -> Bool {
        return true
    }
    
    var body: some View {
        Image(nsImage: image)
            .resizable()
            .scaledToFit()
            .clipShape(.rect(cornerRadius: 4.5))
            .shadow(radius: 4.5)
            // Make it draggable
            .draggable(image)
            // Implement right click -> copy
            .contextMenu {
                Button("Copy") {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.writeObjects([image])
                }
            }
    }
}
extension NonUpdatingImageView: Equatable {}

// This block handles downloading the images. Basically, it starts out with two images ("Default"
// and "Default2") that are stored in the application bundle, and every time the window is opened,
// it tries to fetch two images, replacing each of the currently stored images with the new ones.
// Meanwhile, one of the two currently stored images is displayed in the GUI. This is more or less
// a bad implementation of a queue; I was rushed for time when I wrote this, so it could be a lot
// better.
// We store two images at once because each request takes around 1-2s to complete, so it is possible
// for the user to open the window, close it, and open it again before the initial request has
// completed, in which case they would see the same image as previously.
class ImageViewModel: ObservableObject {
    // These variables hold the two current images.
    @Published var image = NSImage(named: "Default")
    @Published var nextImage = NSImage(named: "Default2")
    
    // Account ID and authorization token for the API used to get the images.
    // An "API" (application programming interface) refers generally to specification for how a
    // caller can use the service it's calling. There are two primary contexts in which the term is
    // used: for code libraries/frameworks, where the API refers to the functions that the framework
    // provides, and web APIs, where a client (our code) makes an HTTP request to a server in a
    // particular manner, as specified by the service's API.
    private let accountID = "(redacted)"
    private let authToken = "(redacted)"
    // Prompt given to the text-to-image model. (Text-to-image is the technical term for a model
    // that generates images.)
    private let prompt = "cute stylized baby llama"

    // This function is where the actual HTTP request is made to fetch the images. Making web
    // requests is a fair bit simpler in scripting languages (Swift is a compiled language), so you
    // can ignore this if you like.
    func fetchImage() {
        // The URL to send the request to. We're using the Cloudflare Workers AI service with the
        // text-to-image model Flux.1 [Schnell] from Black Forest Labs.
        let urlStr = "https://api.cloudflare.com/client/v4/accounts/\(accountID)/ai/run/@cf/black-forest-labs/flux-1-schnell"
        guard let url = URL(string: urlStr) else {
            print("Invalid URL")
            return
        }

        // Build the first request.
        var request1 = URLRequest(url: url)
        request1.httpMethod = "POST"
        request1.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request1.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Build a second request, because we want to fetch two images.
        var request2 = URLRequest(url: url)
        request2.httpMethod = "POST"
        request2.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request2.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Generate a random seed value for the model. True randomness is actually impossible in
        // general, and "randomness" refers to pseudorandomness based on an input seed. For an
        // image model, if it is given the same seed twice, it will generate the same image both
        // times. Therefore we need a new seed for every request.
        let seed1 = UInt64.random(in: UInt64.min...UInt64.max)
        let body1: [String: Any] = ["prompt": prompt, "seed": seed1]
        request1.httpBody = try? JSONSerialization.data(withJSONObject: body1)

        let seed2 = UInt64.random(in: UInt64.min...UInt64.max)
        let body2: [String: Any] = ["prompt": prompt, "seed": seed2]
        request2.httpBody = try? JSONSerialization.data(withJSONObject: body2)

        // Perform the first request.
        URLSession.shared.dataTask(with: request1) { [weak self] data, response, error in
            DispatchQueue.main.async {
                
                if let error = error {
                    print("Network error: \(error.localizedDescription)")
                    return
                }
                
                guard let data = data else {
                    print("No data received")
                    return
                }
                
                do {
                    // The request returns JSON data. (JSON--Javascript Object Notation--is a
                    // serialization format, for transmitting a collection of data across networks.)
                    // Deserialize (parse) the JSON data. Contained in it is the image data,
                    // which is encoded using an encoding scheme called Base64; encoding is
                    // necessary because transmitting bytes outside the range of ASCII (A-Z, 0-9,
                    // and a few symbols) can break things. Decode the image data (stored in PNG
                    // format), and make an NSImage object from it so we can work with it.
                    // (Objects are instances of classes, and classes are groups of functions and
                    // variables that are logically related in some way. NSImage is Apple's class
                    // for working with images. This block of code--ImageViewModel--is a class.)
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let result = json["result"] as? [String: Any],
                       let base64String = result["image"] as? String,
                       let imageData = Data(base64Encoded: base64String),
                       let nsImage = NSImage(data: imageData) {
                        self?.image = nsImage
                        print("Updated image")
                    } else {
                        print("Invalid JSON structure")
                    }
                } catch {
                    print("JSON decoding error: \(error.localizedDescription)")
                }
            }
        }.resume()
        
        // Perform the second request.
        URLSession.shared.dataTask(with: request2) { [weak self] data, response, error in
            DispatchQueue.main.async {
                
                if let error = error {
                    print("Network error: \(error.localizedDescription)")
                    return
                }
                
                guard let data = data else {
                    print("No data received")
                    return
                }
                
                do {
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let result = json["result"] as? [String: Any],
                       let base64String = result["image"] as? String,
                       let imageData = Data(base64Encoded: base64String),
                       let nsImage = NSImage(data: imageData) {
                        self?.nextImage = nsImage
                        print("Updated image")
                    } else {
                        print("Invalid JSON structure")
                    }
                } catch {
                    print("JSON decoding error: \(error.localizedDescription)")
                }
            }
        }.resume()
    }
}
