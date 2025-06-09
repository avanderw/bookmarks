import View from './View.svelte';
import Button from './Button.svelte';
import * as Logic from './Logic';

export const BookmarkForm = {
    View,
    Button,
    ...Logic
};

export default BookmarkForm;