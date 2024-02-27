---
layout: post
title: "Recovering archived Puppet blog posts"
summary: "The Puppet blog team did some housekeeping on historical blog posts. Learn how to recover content that was removed so you can republish in other locations."
image: excavating_treasure.jpg
category:
tags: [puppet, blog, seo]
---

The Puppet blog has long been a treasure trove of content. You never knew what you might find; a product announcement, 
an industry analysis, a user interview, a technical post. And it never deleted content, so people got into the habit of
linking to blog posts to use as reference or documentation.

This was really great in a lot of ways, but it came with its downsides. Outdated content didn't always get updated
expediently and the amount of content just kep growing so there really wasn't a good way to manage updates. Only the
content that was actively noticed and complained about was updated. So links across the web often pointed to old and
outdated content....

**🔔 Unfortunately due to how Google indexing works, that really meant that the old, outdated, and often inaccurate content
surfaced at the top of search results way too darn often!**

During the acquisition, the new marketing team made the decision to declare bankruptcy and start over. They decided to
refocus the blog on mostly industry news and product updates and asked the Community and Engineering teams to republish
still-relevant content onto the [engineering blog](https://dev.to/puppet). They kept some of the old content that was
performing well from an SEO standpoint and still relevant, but archived most of it.

Understandably, this was dismaying for those of us using these posts for documentation! But don't fret, there is a blog
archive located at https://prod-puppet-blog.netlify.app/blog/.

I've created a shortcut a method for retrieving pages from the archive if you have the URL.

1. First drag <a href="javascript:(function(){let url=window.prompt('Enter the old Puppet blog URL','https://puppet.com/blog/…');window.location.href=url.replace('puppet.com','prod-puppet-blog.netlify.app'));})()">this link</a> to your bookmarks folder and give it a reasonable name like "retrieve archived Puppet blog posts."
2. Then when you see a link that leads to an archived post that you'd like to recover right click and copy it.
3. Click the bookmark and paste the URL into the dialog you see.

When you click OK, it will take you to directly the archived content. Save the page for your own reference or
republish it as long as you respect copyright. _**🚨 Please don't link to the archive**_, as there's no guarantee how long it
will stay running.

Happy excavating!

_(image from https://www.worldhistory.org/image/1353/archaeology/)_
