---
layout: post
title: Correcting misinformation with Twitter Birdwatch
summary: I'm sure you see as much misinformation on the interwebs as I do. Wouldn't it be nice to help fact-check it?
image: twitter_birdwatch.jpg
category:
tags: [twitter, social media, misinformation]
---

Information is power. And those who control the narrative have all the power
in the world. In recent years, we've seen the interconnectedness of our digital
communities lead to the weaponization of misinformation.

The obvious example of that was the Jan 6, 2021 insurrection in which a departing
president incited an attempted coup in a pathetic attempt to remain in power and
relevant. He did this via Twitter.

Fortunately, he's since been de-platformed, but the right-wing has squadrons of
misinformation lieutenants regularly attempting to spin current events, gaslight
the nation, and control the minds of their army of followers. One example is
Nikki Haley with her take on "[we've always been at war with Eastasia](https://blog.erratasec.com/2016/02/weve-always-been-at-war-with-eastasia.html)."

[![Nikki Haley misinformation](/assets/images/nikki_haley_misinformation.png)](https://twitter.com/NikkiHaley/status/1428080638658289668)

It's trivial for someone who cares about reality to research Ms. Haley's position
and discover that it's precisely the opposite of what she trumpeted during the
blunders of the last administration. But what of the thousands who take their
Republican misinformation spoon-fed? Simply replying with a correction or more
context often gets buried in the comments.

I have lots of beefs with Twitter's role in this information war, but at least
they're finally trying. They've recently [unveiled a beta test](https://blog.twitter.com/en_us/topics/product/2021/introducing-birdwatch-a-community-based-approach-to-misinformation)
of a new platform called Birdwatch. This allows a diverse community of
fact-checkers to add annotations directly to the tweet to help combat misleading
information. While the jury is still out on whether this platform can prevent
gaming the system, it's certainly a step in the right direction.

To Birdwatch contributors, that same tweet now has an annotation attached which
defangs the gaslight attempt.

![Nikki Haley checked by Birdwatch](/assets/images/nikki_haley_birdwatch.jpg)

The rest of us have to settle for looking up the
[tweet on the Birdwatch site](https://twitter.com/i/birdwatch/t/1428080638658289668).
This carefully metered rollout is critical to ensure that the algorithms and the
community and the moderation strategies deliver accurate results and are
resistant to bad actors, but it's frustrating to have to look up context on
a different site.

To make that a little easier, I wrote a little Javascript snippet to redirect you
to the Birdwatch version of a tweet. Drag the link below to your bookmarks and
click it while viewing any tweet to see if any notes have been added to it

<p><center>
<a href="javascript:(function(){window.location.href = window.location.href.replace(/twitter\.com\/\w+\/\w+/, 'twitter.com/i/birdwatch/t');})();">[Twitter Birdwatch]</a>
</center></p>

This does not address the problem of halting the spread of misinformation to
who gobble it down like candy, or to those who don't care enough to look it up
and let themselves be passively manipulated. But it can help you more easily
fact-check tweets yourself, so that you may be more informed in ongoing
discussions on the topic.

Let's just hope that the experiment is successful and this new feature gets
rolled out to all Twitter users soon.
