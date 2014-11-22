require 'sass-globbing'

# Require any additional compass plugins here.
project_type = :stand_alone

add_import_path "vendor/bower/bourbon/dist/"
add_import_path "vendor/bower/neat/app/assets/stylesheets/"

# Publishing paths
http_path = "/"
http_images_path = "/images"
http_generated_images_path = "/images"
http_fonts_path = "/fonts"
css_dir = "public/stylesheets"

# Local development paths
sass_dir = "sass"
images_dir = "source/images"
fonts_dir = "source/fonts"

line_comments = false
output_style = :compressed
