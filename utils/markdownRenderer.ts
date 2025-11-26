
// Renders markdown to HTML for a richer text experience, styled like ChatGPT/Gemini.
export const renderSimpleMarkdown = (text: string): string => {
    if (!text) return '';

    // Helper for inline formatting
    const applyInlineFormatting = (line: string) => {
        let output = line
            // Escape HTML characters to prevent XSS from raw text while allowing our generated HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Images: ![alt](url)
        output = output.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-3 border border-white/10 shadow-lg" />');

        // Links: [text](url)
        output = output.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 hover:underline break-all transition-colors">$1</a>');

        // Bold: **text** or __text__
        output = output.replace(/(\*\*|__)(.*?)\1/g, '<strong class="font-bold text-white">$2</strong>');

        // Italic: *text* or _text_
        output = output.replace(/(\*|_)(.*?)\1/g, '<em class="italic text-gray-300">$2</em>');

        // Strikethrough: ~~text~~
        output = output.replace(/~~(.*?)~~/g, '<del class="text-gray-500 decoration-gray-500">$1</del>');

        // Highlight: ==text==
        output = output.replace(/==(.*?)==/g, '<mark class="bg-yellow-500/20 text-yellow-200 px-1 py-0.5 rounded mx-0.5 font-medium">$1</mark>');

        // Inline Code: `text`
        output = output.replace(/`([^`]+?)`/g, '<code class="font-code bg-black/40 px-1.5 py-0.5 rounded text-sm text-cyan-300 border border-white/10 mx-0.5">$1</code>');
        
        // Superscript: ^text^
        output = output.replace(/\^([^\^]+)\^/g, '<sup class="text-xs text-gray-300">$1</sup>');

        // Subscript: ~text~
        output = output.replace(/~([^~]+)~/g, '<sub class="text-xs text-gray-300">$1</sub>');

        return output;
    };

    const lines = text.split('\n');
    let html = '';
    let i = 0;
    
    // State trackers
    let inList: 'ul' | 'ol' | 'task' | null = null;
    let inTable = false;

    const closeList = () => {
        if (inList === 'ul') html += '</ul>';
        if (inList === 'ol') html += '</ol>';
        if (inList === 'task') html += '</ul>';
        inList = null;
    };

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // 1. Table Detection
        // Look ahead for separator line |---|
        if (!inTable && trimmedLine.startsWith('|') && i + 1 < lines.length) {
            const nextLine = lines[i+1].trim();
            if (nextLine.startsWith('|') && nextLine.includes('---')) {
                closeList();
                inTable = true;
                
                // Parse Headers
                const headers = line.split('|').filter(cell => cell.trim() !== '').map(h => applyInlineFormatting(h.trim()));
                html += '<div class="markdown-table-container overflow-x-auto my-5 border border-white/10 rounded-lg shadow-sm bg-black/20"><table class="min-w-full text-sm text-left border-collapse"><thead class="bg-white/5 font-semibold text-white border-b border-white/10"><tr>';
                headers.forEach(h => html += `<th class="px-4 py-3 whitespace-nowrap">${h}</th>`);
                html += '</tr></thead><tbody>';
                
                i += 2; // Skip header and separator
                continue;
            }
        }

        if (inTable) {
            if (trimmedLine.startsWith('|')) {
                // Parse Row
                // We handle splitting carefully to avoid empty strings at edges if pipe is at start/end
                const cells = line.split('|');
                // Remove first and last empty elements if they exist due to leading/trailing pipes
                if (trimmedLine.startsWith('|')) cells.shift();
                if (trimmedLine.endsWith('|')) cells.pop();
                
                const formattedCells = cells.map(c => applyInlineFormatting(c.trim()));
                
                html += '<tr class="border-b border-white/5 hover:bg-white/5 transition-colors last:border-0">';
                formattedCells.forEach(c => html += `<td class="px-4 py-2 text-gray-200 align-top">${c}</td>`);
                html += '</tr>';
                i++;
                continue;
            } else {
                // End of table
                html += '</tbody></table></div>';
                inTable = false;
            }
        }

        // 2. Horizontal Rule
        if (line.match(/^[-*_]{3,}$/)) {
            closeList();
            html += '<hr class="my-6 border-white/10" />';
            i++;
            continue;
        }

        // 3. Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
            closeList();
            const level = headingMatch[1].length;
            const content = applyInlineFormatting(headingMatch[2]);
            const styles: Record<number, string> = {
                1: 'text-3xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-3',
                2: 'text-2xl font-bold text-white mt-6 mb-3',
                3: 'text-xl font-semibold text-cyan-300 mt-5 mb-2',
                4: 'text-lg font-semibold text-white mt-4 mb-2',
                5: 'text-base font-bold text-gray-300 mt-3',
                6: 'text-sm font-bold text-gray-400 mt-3 uppercase tracking-wider'
            };
            html += `<h${level} class="${styles[level]}">${content}</h${level}>`;
            i++;
            continue;
        }

        // 4. Blockquotes
        const blockquoteMatch = line.match(/^>\s?(.*)/);
        if (blockquoteMatch) {
            closeList();
            let content = [applyInlineFormatting(blockquoteMatch[1])];
            // consume following blockquote lines
            while(i + 1 < lines.length && lines[i+1].startsWith('>')) {
                i++;
                content.push(applyInlineFormatting(lines[i].substring(1).trim()));
            }
            html += `<blockquote class="border-l-4 border-cyan-500/50 pl-4 my-4 text-gray-300 italic bg-white/5 py-3 rounded-r-lg shadow-sm leading-relaxed">${content.join('<br>')}</blockquote>`;
            i++;
            continue;
        }

        // 5. Task Lists
        const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)/);
        if (taskMatch) {
             if (inList !== 'task') {
                closeList();
                html += '<ul class="space-y-1.5 my-3">';
                inList = 'task';
            }
            const checked = taskMatch[2].toLowerCase() === 'x';
            const content = applyInlineFormatting(taskMatch[3]);
            html += `<li class="flex items-start gap-3 text-gray-300 group">
                <div class="mt-1 flex-shrink-0 w-4 h-4 flex items-center justify-center rounded border transition-colors ${checked ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-gray-600 text-transparent'}">
                    ${checked ? '<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>' : ''}
                </div>
                <span class="${checked ? 'line-through opacity-60 decoration-gray-500' : ''} leading-relaxed">${content}</span>
            </li>`;
            i++;
            continue;
        }

        // 6. Unordered Lists
        const ulMatch = line.match(/^(\s*)[\-*]\s+(.*)/);
        if (ulMatch) {
            if (inList !== 'ul') {
                closeList();
                html += '<ul class="list-disc list-outside space-y-1 my-3 pl-5 text-gray-300 marker:text-cyan-500/70">';
                inList = 'ul';
            }
            html += `<li class="pl-1 leading-relaxed">${applyInlineFormatting(ulMatch[2])}</li>`;
            i++;
            continue;
        }

        // 7. Ordered Lists
        const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
        if (olMatch) {
             if (inList !== 'ol') {
                closeList();
                html += '<ol class="list-decimal list-outside space-y-1 my-3 pl-5 text-gray-300 marker:text-cyan-500/70">';
                inList = 'ol';
            }
            html += `<li class="pl-1 leading-relaxed">${applyInlineFormatting(olMatch[2])}</li>`;
            i++;
            continue;
        }

        // 8. Paragraphs / Plain Text
        if (trimmedLine !== '') {
            closeList();
            let pLines = [applyInlineFormatting(line)];
            // Consume valid paragraph continuation lines
            while (i + 1 < lines.length) {
                const next = lines[i+1];
                // Stop if next line is a special block
                if (next.trim() === '' || 
                    next.match(/^(#{1,6}\s+|>\s?|[-*_]{3,}|[\-*]\s+|\[[ xX]\]\s+|\d+\.\s+|\|)/)) {
                    break;
                }
                pLines.push(applyInlineFormatting(next));
                i++;
            }
            // Use <br> for line breaks within a paragraph if strict markdown line breaks (space-space-newline) aren't required, 
            // but usually standard markdown collapses newlines. Here we join with space for standard behavior.
            html += `<p class="my-3 leading-relaxed text-gray-200">${pLines.join(' ')}</p>`; 
            i++;
            continue;
        }

        closeList();
        i++;
    }
    
    closeList();
    if (inTable) html += '</tbody></table></div>';

    return html;
};
