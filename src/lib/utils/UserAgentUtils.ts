import { browser } from '$app/environment';

export interface UserAgentInfo {
	userAgent: string;
	browser: string;
	os: string;
	device: string;
}

/**
 * Parses user agent string to extract browser, OS, and device information
 * @param userAgent The user agent string to parse
 * @returns Parsed user agent information
 */
export function parseUserAgent(userAgent: string): UserAgentInfo {
	const info: UserAgentInfo = {
		userAgent: userAgent,
		browser: 'Unknown',
		os: 'Unknown',
		device: 'Unknown'
	};

	// Browser detection
	if (userAgent.includes('Firefox') && !userAgent.includes('Chrome')) {
		info.browser = 'Firefox';
	} else if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
		if (userAgent.includes('OPR')) {
			info.browser = 'Opera';
		} else if (userAgent.includes('Brave')) {
			info.browser = 'Brave';
		} else {
			info.browser = 'Chrome';
		}
	} else if (userAgent.includes('Edge')) {
		info.browser = 'Edge';
	} else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
		info.browser = 'Safari';
	} else if (userAgent.includes('Opera')) {
		info.browser = 'Opera';
	}

	// OS detection
	if (userAgent.includes('Windows NT')) {
		const version = userAgent.match(/Windows NT (\d+\.\d+)/);
		if (version) {
			const versionMap: { [key: string]: string } = {
				'10.0': 'Windows 10/11',
				'6.3': 'Windows 8.1',
				'6.2': 'Windows 8',
				'6.1': 'Windows 7'
			};
			info.os = versionMap[version[1]] || `Windows ${version[1]}`;
		} else {
			info.os = 'Windows';
		}
	} else if (userAgent.includes('Mac OS X')) {
		const version = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
		if (version) {
			info.os = `macOS ${version[1].replace(/_/g, '.')}`;
		} else {
			info.os = 'macOS';
		}
	} else if (userAgent.includes('Linux')) {
		if (userAgent.includes('Android')) {
			const version = userAgent.match(/Android (\d+(?:\.\d+)?)/);
			info.os = version ? `Android ${version[1]}` : 'Android';
		} else {
			info.os = 'Linux';
		}
	} else if (userAgent.includes('iPhone OS') || userAgent.includes('iPad')) {
		const version = userAgent.match(/OS (\d+[._]\d+(?:[._]\d+)?)/);
		if (version) {
			const versionStr = version[1].replace(/_/g, '.');
			info.os = userAgent.includes('iPad') ? `iPadOS ${versionStr}` : `iOS ${versionStr}`;
		} else {
			info.os = userAgent.includes('iPad') ? 'iPadOS' : 'iOS';
		}
	}

	// Device detection
	if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
		if (userAgent.includes('iPad')) {
			info.device = 'Tablet';
		} else if (userAgent.includes('iPhone') || userAgent.includes('iPod')) {
			info.device = 'Mobile';
		} else if (userAgent.includes('Android')) {
			info.device = userAgent.includes('Mobile') ? 'Mobile' : 'Tablet';
		} else {
			info.device = 'Mobile';
		}
	} else if (userAgent.includes('iPad')) {
		info.device = 'Tablet';
	} else {
		info.device = 'Desktop';
	}

	return info;
}

/**
 * Gets current user agent information from the browser
 * @returns User agent information or null if not in browser
 */
export function getCurrentUserAgent(): UserAgentInfo | null {
	if (!browser || typeof navigator === 'undefined') {
		return null;
	}

	return parseUserAgent(navigator.userAgent);
}

/**
 * Formats user agent information for display
 * @param info User agent information
 * @returns Formatted string for display
 */
export function formatUserAgentInfo(info: UserAgentInfo): string {
	return `${info.browser} on ${info.os} (${info.device})`;
}

/**
 * Gets a short user agent summary
 * @param info User agent information
 * @returns Short summary string
 */
export function getShortUserAgentSummary(info: UserAgentInfo): string {
	return `${info.browser} - ${info.device}`;
}
