/**
 * BookmarkManager utilities for handling pagination
 */
export const PaginationUtils = {
	/**
	 * Calculate pagination values
	 * @param items Items to paginate
	 * @param currentPage Current page number
	 * @param itemsPerPage Items per page
	 * @returns Pagination information
	 */
	calculatePagination(items: any[], currentPage: number, itemsPerPage: number) {
		const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
		const validCurrentPage = currentPage > totalPages ? totalPages : currentPage;

		// Calculate start and end indices
		const startIndex = items.length === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1;
		const endIndex = Math.min(items.length, validCurrentPage * itemsPerPage);

		// Get paginated items
		const paginatedItems = items.slice(
			(validCurrentPage - 1) * itemsPerPage,
			validCurrentPage * itemsPerPage
		);

		return {
			totalPages,
			startIndex,
			endIndex,
			paginatedItems,
			validCurrentPage
		};
	},

	/**
	 * Navigate to a specific page
	 * @param page The page number to navigate to
	 * @param totalPages Total number of pages
	 * @returns Valid page number
	 */
	goToPage(page: number, totalPages: number): number {
		if (page >= 1 && page <= totalPages) {
			return page;
		}
		return page < 1 ? 1 : totalPages;
	},

	/**
	 * Navigate to the next page
	 * @param currentPage Current page number
	 * @param totalPages Total number of pages
	 * @returns New page number
	 */
	nextPage(currentPage: number, totalPages: number): number {
		if (currentPage < totalPages) {
			return currentPage + 1;
		}
		return currentPage;
	},

	/**
	 * Navigate to the previous page
	 * @param currentPage Current page number
	 * @returns New page number
	 */
	prevPage(currentPage: number): number {
		if (currentPage > 1) {
			return currentPage - 1;
		}
		return currentPage;
	}
};
