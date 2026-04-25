# valerioiacobucci.com

I'm using the process of building my website as field practice to develop with agentic AI. So far it is going very smoothly.

This document provides guidance for humans and AI agents with the `valerioiacobucci.com` codebase.

The file `notes.txt` is also important for monitoring the state of the project, though it is written in the form of a TODO list with boxes to check on completion, and has a tree structure for problem decomposition. It should ALWAYS be checked first for open issues.

## Project Overview

This is the source code for the personal website of Valerio Iacobucci, available at valerioiacobucci.com. It showcases projects, articles, and professional information.

## Features

- Multilingual interface.
- Multilingual markdown based blog with fallback to English, that supports Mermaid diagrams and threejs visualizations.
- Online content editor, with file upload, image compressor, git controls and deploy actions.
- Microblog that gets its feed from a db, supporting images and reactions from users, showing the profile pictures of users that reacted. Only the owner of the site can post on this, and from the dedicated section.
- User login with GitHub's OAuth.
- RSS feed.
- Projects page that regularly gets its updates from GitHub, shows stars and details and lets the user read project' READMEs directly fetching them from their client, and resolves images correctly and renders Mermaid diagrams.
- Search bar for pages, blog posts and projects.
- Fake interactive terminal, where REPL programs can be loaded.

## Requirements

- Extreme speed, leveraging server-side rendering, aggressive caching and React Supsense components.
- Hot module replacement on development mode.
- Lightweight build for low end hardware.
- Separate repos for code and content.

## Tech Stack

The project is built with the following technologies:

- **Framework**: Next.js
- **Reactive components Library**: React
- **Language**: TypeScript (with strict type checking enabled)
- **Package Manager**: pnpm
- **Linting**: ESLint with TypeScript support.

## Deployment

The website is deployed on a low-end VPS. There is currently no dockerization involved in the production deployment. The repository is cloned on `valerio@valerioiacobucci.com:/home/valerio/web/valerioiacobucci.com` and the server is started with the following systemd service.

```ini
[Unit]
Description=valerioiacobucci.com
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/valerio/source/web/valerioiacobucci.com
ExecStart=pnpm run start
Restart=always
Environment=PORT=8080
EnvironmentFile=/home/valerio/source/web/valerioiacobucci.com/.env
RestartSec=3

KillSignal=SIGINT

[Install]
WantedBy=default.target

```

The node process exposes a server at TCP port 8080, but the access to valerioiacobucci.com is behind a nginx proxy, and the connection is secured with SSL:

```nginx
   server {
       server_name valerioiacobucci.com www.valerioiacobucci.com;

       location / {
            proxy_pass http://127.0.0.1:8080;

            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host  $host;
       }

       listen 443 ssl; # managed by Certbot
       ssl_certificate /etc/letsencrypt/live/ip.valerioiacobucci.com/fullchain.pem; # managed by Certbot
       ssl_certificate_key /etc/letsencrypt/live/ip.valerioiacobucci.com/privkey.pem; # managed by Certbot
       include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
       ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
   }
```

## Content

The content git submodule is used to store blog posts and additional details modifiable by the website editors.

## Getting Started

To run the project locally, follow these steps:

1.  **Install Dependencies**: Ensure you have `pnpm` installed. Then, from the root of the project, run:

    ```bash
    pnpm install
    ```

1.  **Run Development Server**:
    ```bash
    pnpm run dev
    ```
    The application will be available at `http://localhost:8080`.