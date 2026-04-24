#!/usr/bin/env bash

UPDATE_SERVICE=update-valerioiacobucci.com.service

function --publish {
	echo "Step 1/3: Pushing 'content' submodule..."
	git -C content push
	git -C content add -A
	git -C content commit -m "$(date '+%Y-%m-%d %H:%M:%S')"


	echo "Step 2/3: Pushing main repository..."
	git add -A
	git commit -m "$(date '+%Y-%m-%d %H:%M:%S')"
	git push

	echo "Step 3/3: Triggering remote update on VPS..."
	ssh valerio@valerioiacobucci.com "bash /home/valerio/source/web/valerioiacobucci.com/scripts/update.sh --setup --full"

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

	echo "Updating submodules (content)..."
	git submodule update --init --recursive --remote

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