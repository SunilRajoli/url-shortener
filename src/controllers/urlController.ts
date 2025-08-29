import { Request, Response } from 'express';
import * as urlService from '../services/urlService';
import { isValidHttpUrl } from '../utils/validation';

/**
 * POST /shorten
 * body: { url: string, customCode?: string }
 */
export async function shorten(req: Request, res: Response) {
  const { url, customCode } = req.body ?? {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'url is required' });
  }

  // validate scheme and format
  if (!isValidHttpUrl(url)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL. Must start with http:// or https://',
    });
  }

  try {
    const row = await urlService.createShortUrl(url, customCode);
    const base = process.env.BASE_URL ?? `${req.protocol}://${req.get('host')}`;
    return res.json({
      success: true,
      data: {
        id: row.id,
        original_url: row.original_url,
        short_code: row.short_code,
        short_url: `${base}/${row.short_code}`,
        created_at: row.created_at,
        clicks: Number(row.clicks),
      },
    });
  } catch (err: any) {
    if (err.message === 'custom_code_taken') {
      return res
        .status(409)
        .json({ success: false, message: 'custom code already taken' });
    }
    if (err.message === 'could_not_generate_unique_code') {
      return res.status(500).json({
        success: false,
        message: 'could not generate unique short code',
      });
    }
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: 'internal server error' });
  }
}

/**
 * GET /:code
 * redirects to original URL (302)
 */
export async function redirectToOriginal(req: Request, res: Response) {
  const { code } = req.params;
  if (!code) return res.status(400).send('Bad Request');

  try {
    const row = await urlService.findByShortCode(code);
    if (!row) {
      return res.status(404).send('Not found');
    }

    // increment clicks asynchronously (don't wait)
    urlService.incrementClicks(row.id).catch(() => { /* ignored */ });

    return res.redirect(302, row.original_url);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
}


/**
 * GET /stats/:code
 * returns analytics (clicks, created_at, original url)
 */
export async function stats(req: Request, res: Response) {
  const { code } = req.params;

  try {
    const row = await urlService.getStatsByCode(code);
    if (!row) {
      return res.status(404).json({ success: false, message: 'short code not found' });
    }

    return res.json({
      success: true,
      data: {
        original_url: row.original_url,
        short_code: row.short_code,
        created_at: row.created_at,
        clicks: Number(row.clicks)
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'internal server error' });
  }
}


/**
 * GET /urls
 * return all shortened urls
 */
export async function list(req: Request, res: Response) {
  try {
    const rows = await urlService.listAllUrls();
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'internal server error' });
  }
}

/**
 * DELETE /:code
 * delete a short url
 */
export async function remove(req: Request, res: Response) {
  try {
    const code = req.params.code;
    const deleted = await urlService.deleteUrlByCode(code);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'short url not found' });
    }

    return res.json({ success: true, message: 'short url deleted', data: deleted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'internal server error' });
  }
}

/**
 * PUT /:code
 * update a short url's destination
 */
export async function update(req: Request, res: Response) {
  try {
    const code = req.params.code;
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'url is required' });
    }

    if (!isValidHttpUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL. Must start with http:// or https://',
      });
    }

    const updated = await urlService.updateUrlByCode(code, url);

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: 'short url not found' });
    }

    return res.json({
      success: true,
      message: 'short url updated',
      data: updated,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: 'internal server error' });
  }
}