---
title: "Malleable Systems Challenge: Fearless Extensibility A Conceptual Approach"
date: "2024-08-17"
---

This post is a response to the first **[Malleable Systems Challenge Problem](https://forum.malleable.systems/t/a-new-community-activity-challenge-problems/196)**, which explores the theme of **[fearless extensibility](https://forum.malleable.systems/t/challenge-problem-fearless-extensibility/205)**. The challenge asks participants to think deeply about how we can achieve powerful extensibility in systems without introducing significant security and maintenance risks. In this post, I’ll be exploring several dimensions of the problem and proposing ideas for balancing the benefits of extensibility with the inherent challenges. This post is the first in what may become a series, where I draw from real-world examples and systems to illustrate the key concepts.

# Fearless Extensibility: A Conceptual Approach

In this post, we'll explore the challenge of **fearless extensibility** — designing systems that allow users to extend their functionality without introducing undue risks or complexity. We'll examine different dimensions of extensibility and propose ideas for balancing power and safety. Along the way, we'll reference real-world systems and academic research to illustrate key points. <!-- TODO: Make sure I reference real systemd or academic research. >

## Intentional vs. Ad-Hoc Extensibility

One important distinction to make in the design of extensible systems is between **intentional** and **ad-hoc** extensibility.

- **Intentional Extensibility:** Systems are designed with explicit extension points and interfaces that encourage safe, structured modifications. These points are documented and supported by the system's maintainers.
- **Ad-Hoc Extensibility:** Users extend the system by modifying the existing system, using undocumented APIs, or breaking through other implementation details. These modifications often lead to maintenance headaches, as they are more likely to break with future updates.

### Moving from Ad-Hoc to Intentional Extensibility
How can we migrate from ad-hoc to intentional extensibility? Is there a way to allow users to extend systems locally and then easily upstream their changes into a more general case?

One possible approach is to create a clear **migration path** for user extensions, where user-created local modifications can be incorporated into official APIs or extension points over time.

## Trust and Authority

Another key issue in extensibility is **trust**. When allowing third-party extensions, how can we trust that the code won't break the system or introduce security vulnerabilities? 

### Establishing Trust in Extensible Systems
One potential solution is to build **shared software sources**, such as package managers or app stores, where extensions are vetted and reviewed by the community. Additionally, **cryptographic authorities** can help verify that code has been reviewed and approved by trusted parties.

Beyond that, we can use **static analysis** and **programming language techniques** to restrict what extensible components can do. For example, can we ensure that an extension cannot read from the file system or access the network unless explicitly allowed?

Another concept to explore here is **capability-based security (OCAP)**, which emphasizes controlling what resources (or capabilities) an extension is allowed to access.

## Data-Oriented Consistent Approach

When designing extensible systems, it's crucial to build on **sound data-oriented primitives**. By focusing on more flexible, composable interactions from the start, we can create systems that are easier to extend later on, without resorting to bolted-on complexity.

## Compositionality

Finally, a core challenge in extensibility is ensuring that systems remain **composable**. How do we ensure that extensions can work together in a predictable, understandable way?

### Making Extensible Systems Composable
We can look to functional programming and **mathematical rigor** for inspiration. For example, **static analysis** can help us ensure that extensions adhere to certain properties, while **debuggability** and **observability** are essential for maintaining a high level of trust in the system.

## Conclusion

Designing extensible systems is a complex challenge, but by focusing on **intentional extensibility**, **trust**, and **compositionality**, we can create systems that empower users while minimizing risks. Throughout this series, we'll dive deeper into these concepts and explore real-world examples of systems that have successfully balanced these concerns.