---
title: "Dimensions of Extensibility"
date: "2024-10-29"
---

This post is a response to the first **[Malleable Systems Challenge Problem](https://forum.malleable.systems/t/a-new-community-activity-challenge-problems/196)**, which explores the theme of **[fearless extensibility](https://forum.malleable.systems/t/challenge-problem-fearless-extensibility/205)**. The challenge asks participants to think deeply about how we can achieve powerful extensibility in systems without introducing significant security and maintenance risks. In this post, I’ll be exploring several dimensions of the problem and proposing ideas for balancing the benefits of extensibility with the inherent challenges.

Inspired by [Technical dimensions of programming systems](https://tomasp.net/techdims/) and [Technical Dimensions of Feedback in Live Programming Systems](https://joshuahhh.com/dims-of-feedback/), I aim to outline different dimensions of extensibility to facilitate comparison between designs and foster discussions around malleable systems. This is not intended to be a comprehensive list but will evolve over time. If you have any thoughts or suggestions, feel free to reach out and connect with me.

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

<!-- TODO -->

### Data-Oriented Consistent Approach

When designing extensible systems, it's crucial to build on **sound data-oriented primitives**. By focusing on more flexible, composable interactions from the start, we can create systems that are easier to extend later on, without resorting to bolted-on complexity.

## Conclusion

Designing extensible systems is a complex challenge, but by focusing on **intentional extensibility**, **trust**, and **compositionality**, we can create systems that empower users while minimizing risks. Throughout this series, we'll dive deeper into these concepts and explore real-world examples of systems that have successfully balanced these concerns.