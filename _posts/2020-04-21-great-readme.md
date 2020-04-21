---
layout: post
title: "Writing a great README"
summary: Writing a great README is all about knowing how much time your reader has to give you and what they're willing to spend it on.
image: readme.png
tags: [development, code, documentation]
---

Surprisingly enough, it's not really that hard to write a good README. The key is
to remember who you're writing for and why. See, it's all about time and resource
management---specifically, the time that a reader is willing to give you.

This is often overlooked because most people write READMEs to be informative, but they
don't take into account how much context is implied. Most people reading
about your project for the first time are not yet invested in it. If your story
isn't immediately compelling, without all the implied context that you've got
due to your involvement in the project, then there's very little incentive to
keep reading instead of going to the next hit in their search results.

I generally recommend the 5/30/90 rule. It works a bit like this:

## 5 seconds!

When someone's looking at your project for the first time, you get five seconds,
maximum. In this five seconds, the reader is not deciding to *use* your project;
they're deciding whether they should give you another 30 seconds of their time
to continue reading.

To maximize this five seconds, you need to focus on two things. At first glance,
the overall look of the README should be welcoming and not intimidating. To help
with that, make your paragraphs short and nicely spaced. Include graphics that
support your theme, and if you can, create a screencast of what your project does.

Second, your first few sentences should position your project as a compelling
solution to a genuine problem. You do *not* need to be informative or pedantically
accurate at this point. Your goal here isn't to convey information, but to interest
the reader enough that they give you the time to be informative.

## 30 seconds!

Now if they're still reading, then you've passed the first bar and get another
30 seconds or so. You're still talking at a high level, but you can start
sharing some of the use cases. Talk about some of the problems your project provides
elegant solutions to. Briefly describe some of the benefits your project offers.

But whatever you do, don't get into too much detail. This is not the time to talk
about the edge cases. This is the time for people to get a general idea of what
your project enables.

Please notice that we've not talked about *features* here. As engineers, we tend
to think about things in a very technical manner. But in general, details like
the architecture you've designed or the frameworks you're using are of very
little interest for people evaluating a tool. They have problems that they want
to solve, and their problem is not same as yours.

Put yourself in the mindset of a person evaluating a tool for the first time, and
who doesn't really care about the technical implementation yet.

## 90 seconds!

Finally you can share a couple of details! You've got about a minute and a
half to show a bit of the complexities. Show some simplified examples of
running the tool. Share a short code snippet, some of the configuration options,
or a few command line options.

This is still not *documentation* or *reference material*, but you've now got the
opportunity to better explain the niche your project fits into. Are there
caveats affecting how the tool might or might not work for certain cases? Are
there integrations with other tools that might amplify functionality?

If there are architectural decisions that affect interoperability, usability,
or performance then it might make sense to briefly describe them at this point.

## The rest!

You've convinced them. You might be tempted to finally drop into generated
API reference material mode, but resist! Remember the first impression rule. If
your README looks intimidating, then people lose interest.

Instead, show them how to install it. If it's a complex install process, link to
installation docs. Provide a link to other relevant docs, such as a *Getting
Started* guide, tutorials, or reference material.

Now you've got a README that does its job well. It grabs the attention of people
who have the problem your tool was designed to solve and convinces them to learn more
and try it out.

### Examples

See a curated list of pretty decent REAME examples at the
[awesome-readme](https://github.com/matiassingers/awesome-readme) repo.
