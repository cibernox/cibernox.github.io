---
layout: post
title: "Tweak and improve your new octopress blog"
date: 2013-04-22T21:28:23+02:00
comments: true
external-url:
categories: [ruby,octopress,seo]
published: true
keywords: tutorial,octopress,2.1,github pages,seo,own domain
description: "These are the first steps I would follow after create an octopress blog."
---

After publish your blog, there is still a few things you can do to improve it. These are some of them:

### Point your own domain to GitHub pages

This is a must have. Have your own domain is cool. If you don't like the _.github.io_ at the end of the address bar,
you can point your domain to github.

* Create a file named `CNAME` in the root of your repository with the nude name of domain. With nude I mean
  without `www.` of `http://`.
  {% codeblock CNAME %}
  miguelcamba.com
  {% endcodeblock %}
* Configure the DNS in your domain control panel. Make the root domain (_the @_) point to `204.232.175.78`, which is
  github's IP, and the _www_ subdomain to `your-username.github.com`. Screenshot from my namecheap configuration.

{% img center /images/dns_configuration.jpg %}

And wait the dns changes to propagate. For me it took less than 15 minutes but can take much longer.

### Add a new page to your blog
The main part of your blog are the posts but with octopress you can create any page or section that makes sense to you.
Some ideas: Host the documentation/demo of one of your opensource proyects, an about-me section, a portfolio...

The pages can be places anywhere in the **/source** folder, but there is 2 main aproaches.

* If you want the url to look like *domain.com/about-me* you must create a file **/source/about-me/index.markdown**.
You can use the rake task `rake new_page[about-me]`
* If you want the url to look like *domain.com/about-me.html* you must create a file **/source/about-me.markdown**.
You can use the rake task `rake new_page[about-me.html]`

Creating this page is more or less like build an static html side with some simple suport for layouts and
partials. The first lines of each page have some comments to configure which layout you want, enable or disable
the footer and more.


### Add google analytics

Octopress is the essence of a blog generator. It only server static content, so it don't provides you
an admin area to record and see the trafic and see the stats. This is not a big deal since google analytics is
the most powerfull tool you can desire in this area, and octopress has built-in support for it out of the box.

Create a free acount if you don't have one, and add a _New account_ for your blog. During this process you
will get an ID number like _AB-12345678-9_.

Go and edit your the config file and add this id to the google analytics key.

{% codeblock _config.yml %}
---
# ---------------------------------- #
#   Google Analytics Configuration   #
# ---------------------------------- #

google_analytics_tracking_id: AB-12345678-9
{% endcodeblock %}

**Done.**

### Basic SEO considerations

First of all, I need to say that I am **NOT** a fan of SEO. In fact, for me is the biggest lie of the modern times, but still
there is a few good practices that you should follow to help google to do its job.

##### Keywords & description
You should add keywords for your blog and for every post you create. This keywords will help google to know
for what searches your content can be a good result, so pick the words wisely. Think about the words you would
type in google to find your own article, but pick just half a docen.

By example, the previous post could have these keywords: **tutorial,create,octopress,2.1,host,github pages,deploy**

The description is also important for google, since it's the phase that will show under the link when this blog post
is listed as a search result.

You can these information in the comments section at the beginning of each _.markdown_ file, like the posts.
{% codeblock %}
---
layout: post
title: "Tutorial: Create a blog with octopress and host it in github pages"
date: 2013-04-22T21:24:21+02:00
comments: true
categories: [ruby,octopress]
keywords: tutorial,create,octopress,host,github pages,deploy
description: What is octopress and how create and deploy your blog in github pages
---
{% endcodeblock %}

The keywords and the description will be added automatically to the `<head>` tag.

But there is still a things that can be improved. At the time of writting this, the description was missing
in the posts, and there is no keywords for the blog level. A few lines fixed that problem.

{% codeblock /source/_includes/head.html %}
{% raw %}
<!DOCTYPE html>
<!--[if IEMobile 7 ]><html class="no-js iem7"><![endif]-->
<!--[if lt IE 9]><html class="no-js lte-ie8"><![endif]-->
<!--[if (gt IE 8)|(gt IEMobile 7)|!(IEMobile)|!(IE)]><!--><html class="no-js" lang="en"><!--<![endif]-->
<head>
  <meta charset="utf-8">
  <title>{% if page.title %}{{ page.title }} - {% endif %}{{ site.title }}</title>
  <meta name="author" content="{{ site.author }}">

  {% capture description %}{% if page.description %}{{ page.description }}{% elsif site.description %}{{ site.description }}{% endif %}{% endcapture %}
  <meta name="description" content="{{ description }}">
  {% capture keywords %}{% if page.keywords %}{{ page.keywords }}{% elsif site.keywords %}{{ site.keywords }}{% endif %}{% endcapture %}
  <meta name="keywords" content="{{ keywords }}">
{% endraw %}
{% endcodeblock %}

The general keywords and description for your blog should be placed in **_config.yml**

##### Categorize your posts

Don't forget to add a category (or categories) for each post. Users will be able to find related posts and google
will apreciate also this information.
