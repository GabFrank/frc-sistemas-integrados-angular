export async function imageToClip(url) {
    try {
        const data = await fetch(url);
        const blob = await data.blob();
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        console.log('Image copied.');
    } catch (err) {
        console.error(err.name, err.message);
    }
}