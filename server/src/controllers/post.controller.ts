import { PostService } from '../services/post.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class PostController {
  static create = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { content, mediaUrls, groupId } = req.body;
    const post = await PostService.createPost(req.user!.userId, content, mediaUrls, groupId);
    res.status(201).json({ post });
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res) => {
    await PostService.deletePost(req.params.postId!, req.user!.userId, req.user!.role);
    res.status(204).send();
  });

  static feed = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await PostService.getFeed(req.user!.userId, cursor);
    res.json(result);
  });

  static byUser = asyncHandler(async (req, res) => {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await PostService.getUserPosts(req.params.username!, cursor);
    res.json(result);
  });

  static byGroup = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await PostService.getGroupPosts(req.params.groupId!, req.user?.userId, cursor);
    res.json(result);
  });

  static toggleLike = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const result = await PostService.toggleLike(req.params.postId!, req.user!.userId);
    res.json(result);
  });

  static addComment = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const comment = await PostService.addComment(req.params.postId!, req.user!.userId, req.body.content, req.body.parentId);
    res.status(201).json({ comment });
  });

  static listComments = asyncHandler(async (req, res) => {
    const comments = await PostService.getComments(req.params.postId!);
    res.json({ comments });
  });
}
