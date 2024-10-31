---
title: "Dimensions of Extensibility"
date: "2024-10-29"
---

This post is a response to the first **[Malleable Systems Challenge Problem](https://forum.malleable.systems/t/a-new-community-activity-challenge-problems/196)**, which explores the theme of **[fearless extensibility](https://forum.malleable.systems/t/challenge-problem-fearless-extensibility/205)**. The challenge asks participants to think deeply about how we can achieve powerful extensibility in systems without introducing significant security and maintenance risks. In this post, I’ll be exploring several dimensions of the problem and proposing ideas for balancing the benefits of extensibility with the inherent challenges.

Inspired by [Technical dimensions of programming systems](https://tomasp.net/techdims/) and [Technical Dimensions of Feedback in Live Programming Systems](https://joshuahhh.com/dims-of-feedback/), I aim to outline different dimensions of extensibility to facilitate comparison between designs and foster discussions around malleable systems. This is not intended to be a comprehensive list but will be a live document that will evolve over time. If you have any thoughts or suggestions, feel free to reach out and connect with me.

## Open vs. Closed Extensibility

A key distinction in the design of extensible systems is between open and closed extensibility, drawing inspiration from the [open/closed](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle) principle of object-oriented design.

- **Open Extensibility:** Users extend the system by modifying the existing system, directly modifying source code, using undocumented APIs, or breaking through other implementation details. These modifications may lead to maintenance headaches, as they are more likely to break with future updates.
- **Closed Extensibility:** Systems are designed with explicit extension points and interfaces that encourage safe, structured extension. These points are documented and supported by the system's maintainers. Unfortunately this means that extension can only be as powerful as these points allow and therefore may be limited in power by an authors original design.

### Moving from Open to Closed Extensibility

How can we migrate from open to closed extensibility? Is there a way to allow users to extend systems locally and then easily upstream their changes into a more general case?

One possible approach is to create a clear **migration path** for user extensions, where user-created local modifications can be incorporated into official APIs or extension points over time.

## Trust and Authority

Another key issue in extensibility is **trust**. When allowing third-party extensions, how can we trust that the code won't break the system or introduce security vulnerabilities?

### Establishing Trust in Extensible Systems

One potential solution is to build **shared software sources**, such as package managers or app stores, where extensions are vetted and reviewed by the community. Additionally, **cryptographic authorities** can help verify that code has been reviewed and approved by trusted parties.

Beyond that, we should use **static analysis** and **programming language techniques** to restrict what extensible components can do. For example, can we ensure that an extension cannot read from the file system or access the network unless explicitly allowed?

Another concept to explore here is [**capability-based security (OCAP)**](https://en.wikipedia.org/wiki/Object-capability_model), which emphasizes controlling what resources (or capabilities) an extension is allowed to access.

## Orthogonality

A crucial aspect of designing extensible systems is ensuring that orthogonal extensions do not interfere with each other. **Non-interference** means that multiple extensions can coexist without breaking or altering each other’s behavior in normal operation, preserving the stability and predictability of the system. **Orthogonality** is the property of extensions that obviously _should not_ affect each other.

> A styling extension for a web browser and a tab manager would be examples of **orthogonal** extensions since you would not expect any confluence of behavior when having both.

## Compositionality

While orthogonality focuses on ensuring that independent extensions do not interfere, **compositionality** goes a step further by enabling multiple extensions to work together in a predictable and structured way. Compositional systems allow extensions to combine and build on each other’s functionality, often producing more powerful results than any single extension alone.

The challenge of compositionality lies in ensuring that extensions can interoperate smoothly, without unexpected interactions or conflicts. To achieve this, systems need well-defined interfaces and extension points that provide predictable behavior when used in combination. In addition they may also need ways for end-users to handle intrinsic conflicts themselves.

### Making Extensible Systems Composable

I am obviously biased given my background, but I believe we can look to functional programming and **mathematical rigor** for inspiration. For example, **static analysis** can help us ensure that extensions adhere to certain properties, while **debuggability** and **observability** are essential for maintaining a high level of trust in the system.

## Substrates

Jonathan Edwards introduced **substrates** to me during his [LIVE Keynote](https://www.youtube.com/watch?v=4GOeYylCMJI&t=2286s) at [SPLASH](https://2024.splashcon.org/) this month. He gives some criteria as to what define a software substrate. My interpretation is that **substrates** are the computational model and framing in which systems are defined along with that model being exposed to a user so programming is using. So in a sense they define the data model as well as how computation itself can be represented in a system. Possible substrates could include POSIX, spreadsheets, objects, actors, or functional paradigms. With regards to extensibility it's important to design these substrates in such a way that it allows for the extensible properties we'd like to have.

### Embedding

When building extensible systems, it’s critical to ground them in **clear, well-defined primitives**. Designing systems with composable, flexible interactions from the outset ensures that extensibility can be smoothly incorporated later, rather than having complexity bolted on after the fact. Effective extensibility deeply embeds into the structure of the **substrates** rather than existing as an isolated layer on top. This allows extensions to integrate seamlessly into the system, enabling them to express their own data models and computations in a natural and coherent way. In short, for true **composition** to thrive, the substrate must be expressive enough to accommodate extensions without breaking its core structure or creating unnecessary friction.

## Conclusion

Designing extensible systems is a complex challenge. The ideas above are clearly incomplete but I hope can be a jumping off point for a discussion about what we value in the future.