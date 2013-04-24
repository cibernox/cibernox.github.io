---
layout: post
title: "Tutorial: Create a blog with octopress and host it in github pages"
date: 2013-04-22T21:24:21+02:00
comments: true
categories: [ruby,octopress]
keywords: tutorial,create,octopress,host,github pages,deploy
description: What is octopress and how create and deploy your blog in github pages
---

I'll start talking about the last thing I started to experiment with, that is this very blog you are
reading right now, built with Jekyll + Octopress.

### Jekyll.
Straight-forward definition taken directy from the Github's repository description.

{% blockquote https://github.com/mojombo/jekyll %}
Jekyll is a blog-aware, static site generator in Ruby
{% endblockquote %}

What does that means? The concept of Jekyll is a bit different from the usual blog engine you might
be used to see arround (read: _Wordpress_).

The tipical blog engine is some kind of web app that integrates administration tools, 3rd party plugins,
WYSIWYG editor, login system, automatic draft saving, flux condenser... and also serves your static posts.
As you see, most of the features a blog platform provides are not part of a **real** blog's _raison d'etre_,
which is to publish content to the world and allow the world to reach that content. Jekyll gets rid of all
these non-esential features. Is just a blog *generator*.

The keyword here is **generator**. Jekyll don't serves your blog, it only generates the blog as a bunch of static
pages. No content is built at runtime, the html is created at complilation time. This makes the blog
super-simple and blazing fast from the outside. No server processing, your blog is prebuilt.

What we loss in exchange? Well, almost everything else. You don't have an admin area, you don't have
an online editor, but hey! `We are programmers`.

* We don't need to save drafts, we have even a better tool called version control systems.
* We don't like text processors with lots of buttons and menus, we are used to write plain text, and we do it much faster in Markdown in owr favourite text editor.
* We don't need to admin tools. We make changes, commit those changes and push them.

Of course, this means that Jekyll is not for everybody. Is built for people that is familiar with the
development process and wants to have full control over the process. Each blog posts is placed in a
markdown file (it can also be textile of just plain HTML if your prefer) following some naming and
directory structure conventions, and then compiled into the final html structure that will be accessible
from the outside.

Writing, styling, compiling and adding javascripts is up to you, and now is where Octopress comes into
the scene.

### Octopress

Octopress is blogging framework built on top of Jekyll.
It extends Jekyll in several ways, but the main ones are:

* Support for themes. Easy to install, based on HTML5 semantics, and mobile-friendly.
* Provides a complete collection of plugins for common things like comments, share in social networks
  and more. Since octopress is very focused into programming world, there is also plugins to embed code
  from files in our local system, from gists and even from github's commits, with syntax highlighting
  and all the refinements you can desire.
* A collection of rake tasks that automates development and deploy.

For this tutorial I'll be using the latest code direclty from the master branch and ruby 2.0.

### Instalation

The fist step is to get octopress, cloning the repo and give it the name you want for your blog.

{% codeblock %}
git clone git://github.com/imathis/octopress.git coder_blog
{% endcodeblock %}

You'll see that octopress has a `.rbenv-version` file in the root folder that specify ruby 1.9.3-p194 as the desired version.
Maybe you want to update that file to the fresh ruby `2.0.0-p0` as I did. It's totally compatible. Living on the edge.

Now you can install all dependencies with bundler and run our first rake task to install a theme.

{% codeblock %}
bundle install
rake install
{% endcodeblock %}

`rake install` will install the default theme, but you can install any theme you like cloning the desired
theme into the `.themes` folder and run the task with the name of the theme. By example, to install the fabric theme:

{% codeblock %}
$ cd octopress
$ git clone git://github.com/panks/fabric.git .themes/fabric
$ rake install['fabric']
$ rake generate
{% endcodeblock %}

You can see a list with some available themes [here](https://github.com/imathis/octopress/wiki/3rd-Party-Octopress-Themes) but there is a lot more.

### Configuration

The next step is to configure the basics of your blog.
Current master branch _(octopress 2.0)_ only has a single configuration file (`_config.yml`)

Let's fill only the minimum information.

{% codeblock _config.yml %}

url: fake.coderblog.com
title: Coder blog
subtitle: For example purposes only
author: Miguel Camba
simple_search: http://google.com/search
description: Simple blog built with octopress

# ...
# Lots of configuration parameters.
{% endcodeblock %}

### The first post

Now we can create our first post. The naming convention is explained perfectly in the official documentation:
Blog posts must be stored in the **source/_posts** directory and named according to Jekyll’s naming conventions: `YYYY-MM-DD-post-title.markdown`.

Instead of generate the file manually, it's much easier to use the built-in rake task `rake new_post["Title of the post"]`
This task creates a new post with the given title as long as some metadata used by octopress. This is the comments
of this very post.

{% codeblock 2013-04-15-tutorial-create-an-octopress-blog-and-host-it-in-github-pages.markdown lang:yaml%}
---
layout: post
title: "Tutorial: Create a blog with octopress and host it in github pages"
date: 2013-04-22T21:24:21+02:00
comments: true
categories: [ruby,octopress]
---
{% endcodeblock %}

And now, It's your turn. Write somethin interesting. Remember that each time you want to see the preview, you need to regenerate the
blog, but there is another rake task for this too, the `rake preview` task regenerates the content watching for changes and
starts a small server in port 4000 to serve the blog.

Take a look also to `rake generate` (generates the content in the **/public** folder manually) and `rake watch`
(watch for changes into **/source** and **/sass** folders and generates the files automatically)

### Deploy to github pages

Github pages is an ideal host for this kind of blogs. It's free, fast, reliable and very very geek. In fact nowardays it has
become the most accurate and widespread resume for coders, and so, github pages can be the best way to introduce yourself.

To publish your blog in github pages, the first step is to create a github pages repository. It's really simple,
and you can find the instructions here: [Creating Pages with the automatic generator](https://help.github.com/articles/creating-pages-with-the-automatic-generator)

Once you have finished this steps, you'll have a repository named as `your-username.github.io`, almost empty. You want to deploy your first article to
that empty repository, but you before that you should know how github pages work.

Github pages expect to have _two branches_, the **source** branch and the **master** branch.
The **master** branch is the one that github pages will show. The changes in the **source** branch won't be published
until you push your changes to master. A very simple workflow we use very often while coding, applied to publishing.
You can configure those branchs manually and add your github pages repository as a remote, but there is also a rake
task that does all for you: `rake setup_github_pages[repo]`.

In the case of this blog, I ran `rake setup_github_pages[git@github.com:cibernox/cibernox.github.io.git]` and the
`rake deploy` to upload the blog. In a snap the blog will be accessible in the url **http://your-username.github.io**.


Remember that `rake deploy` just generates the blog a push to the **master** branch. Your **source** branch won't be
uploaded to github if you don't want to. You probably want, to have a secure backup online, among other reason. Commit your
changes and do `git push origin source`.

##### Advice for deploy
I've found a problem running the rake task that setups for github pages. If you have a **CNAME** file to
specify the domain of your blog, the rake task will make some weird assumptions about naming that make the
task fail. So, if you plan to redirect your domain to github pages, add the **CNAME** file after running this task.


### Next steps

Now your blog is online, so what's next? These are only advices, but you may be interested in perform some of this tasks.

* Redirect your own domain to github pages. Because is cool to have your own domain.
* Add a entire new section. Like an about-me section (hubris is hubris).
* Add google analytics to see the visitants of your blog. Since octopress doesn't provide administration
panel, google analytics is the most convenient way to keep an eye on the traffic of your blog.
* Basic SEO. I am **NOT** a fan of SEO. In fact, for me is the biggest lie of the modern times. But there is a few good practices
that you should follow to help google to do its job.

In the next article I'll be covering those topics. Stay tuned.
