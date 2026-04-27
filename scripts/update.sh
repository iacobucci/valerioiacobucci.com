#!/usr/bin/env bash

UPDATE_SERVICE=update-valerioiacobucci.com.service

function --content {
	clone content
	cd content
	git pull
}

function --publish {
	echo "Step 1/2: Pushing 'content' repository..."
	if [ -d "content/.git" ]; then
		if ! git -C content diff --quiet || ! git -C content diff --cached --quiet; then
			git -C content add -A
			git -C content commit -m "$(date '+%Y-%m-%d %H:%M:%S')"
		fi
		git -C content push
	fi


	echo "Step 2/2: Pushing main repository..."
	if ! git diff --quiet || ! git diff --cached --quiet; then
		git add -A
		git commit -m "$(date '+%Y-%m-%d %H:%M:%S')"
	fi
	git push

	echo "Triggering remote update on VPS..."
	ssh valerio@valerioiacobucci.com "bash /home/valerio/source/web/valerioiacobucci.com/scripts/update.sh --setup --full"

	--watch
}

function --publish-app {
	echo "Pushing main repository (skipping content)..."
	if ! git diff --quiet || ! git diff --cached --quiet; then
		git add -A
		git commit -m "$(date '+%Y-%m-%d %H:%M:%S')"
	fi
	git push

	echo "Triggering remote update on VPS (app only)..."
	ssh valerio@valerioiacobucci.com "bash /home/valerio/source/web/valerioiacobucci.com/scripts/update.sh --setup --no-content"

	--watch
}

function --setup {
	systemctl --user stop $UPDATE_SERVICE
	systemd-run --user --no-block --unit=$UPDATE_SERVICE bash -c "/home/valerio/source/web/valerioiacobucci.com/scripts/update.sh --job $1"
}

function --job {
	export NODE_OPTIONS=--max-old-space-size=1536

	cd /home/valerio/source/web/valerioiacobucci.com
	
	echo "Pulling latest changes from main repository..."
	git pull

	if [ "$1" != "--no-content" ]; then
		echo "Updating content repository..."
		if [ -d "content/.git" ]; then
			git -C content pull
		else
			git clone ssh://valerio@rockbp:/git/content.git content
		fi
	else
		echo "Skipping content update as requested."
	fi

	echo "Installing dependencies..."
	pnpm install

	echo "Building application..."
	pnpm run build

	echo "Restarting service..."
	systemctl --user restart valerioiacobucci.com
	
	echo "Update complete!"
}

function --watch {
	ssh valerio@valerioiacobucci.com "journalctl --user -f -u $UPDATE_SERVICE"
}

$@
